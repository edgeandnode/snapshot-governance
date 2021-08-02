import fs from 'fs'
import 'isomorphic-unfetch'
import { Client as GraphQLClient, gql } from '@urql/core'
import * as dotenv from 'dotenv'
import { exit } from 'process'

dotenv.config()

const PAGE_SIZE = 100

// Queries

const PROPOSALS_QUERY = gql`
  query Proposals($spaces: [String]!, $first: Int!, $skip: Int!) {
    proposals(
      first: $first
      skip: $skip
      where: { space_in: $spaces }
      orderBy: "created"
      orderDirection: desc
    ) {
      id
      author
      title
      space {
        id
      }
    }
  }
`

const VOTES_QUERY = gql`
  query Votes($proposal: String!, $first: Int!, $skip: Int!) {
    votes(first: $first, skip: $skip, where: { proposal: $proposal }) {
      id
      voter
      proposal {
        id
      }
      space {
        id
      }
    }
  }
`
// Types

type Proposal = {
  id: string
}

type ProposalsResponse = {
  proposals: Proposal[]
}

type Vote = {
  id: string
}

type VotesResponse = {
  votes: Vote[]
}

async function getProposals(client: GraphQLClient, spaces: Array<string>) {
  try {
    let fetchNextPage = true
    let skip = 0

    while (fetchNextPage) {
      fetchNextPage = await getProposalsPage(client, spaces, skip)
      skip += PAGE_SIZE
    }
  } catch (error) {
    console.error(error)
  }
}

async function getProposalsPage(
  client: GraphQLClient,
  spaces: Array<string>,
  skip: number,
): Promise<boolean> {
  const response = await client
    .query(PROPOSALS_QUERY, { spaces, first: PAGE_SIZE, skip })
    .toPromise()

  const data: ProposalsResponse = response.data

  if (!data.proposals.length) {
    return false
  }

  for (const proposal of data.proposals) {
    const proposals = fs.readFileSync('./data/proposals.txt', {
      encoding: 'utf8',
      flag: 'a+',
    })
    const duplicateProposal = proposals.includes(proposal.id)
    if (duplicateProposal) {
      console.log(`Duplicate proposal    : ${proposal.id}`)
    } else {
      fs.appendFileSync('./data/proposals.txt', proposal.id + '\n')
      console.log(`Added proposal        : ${proposal.id} to proposals.txt`)
    }
  }
  return true
}

async function getVotes(client: GraphQLClient) {
  try {
    let fetchNextPage = true
    let skip = 0

    while (fetchNextPage) {
      fetchNextPage = await getVotesPage(client, skip)
      skip += PAGE_SIZE
    }
  } catch (error) {
    console.error(error)
  }
}

async function getVotesPage(client: GraphQLClient, skip: number): Promise<boolean> {
  try {
    const proposals = fs
      .readFileSync('./data/proposals.txt', { encoding: 'utf8', flag: 'a+' })
      .split('\n')
    proposals.pop() // remove final new line
    console.log(proposals)

    // Here  we query for the proposal votes
    // Note - if no votes have been created, it will just return an empty object
    for (const proposal of proposals) {
      const response = await client
        .query(VOTES_QUERY, { proposal, first: PAGE_SIZE, skip })
        .toPromise()
      const data: VotesResponse = response.data

      if (!data.votes.length) {
        return false
      }

      // Once we grab the proposal, from this end point, we need to parse out all of the
      // IPFS hashes, and add them to a txt file for ipfs-sync
      for (const vote of data.votes) {
        const votes = fs.readFileSync('./data/votes.txt', {
          encoding: 'utf8',
          flag: 'a+',
        })
        const duplicateVote = votes.includes(vote.id)
        if (duplicateVote) {
          console.log(`Duplicate vote        : ${vote.id}`)
        } else {
          fs.appendFileSync('./data/votes.txt', vote.id + '\n')
          console.log(`Added vote            : ${vote.id} to votes.txt`)
        }
      }
    }
  } catch (error) {
    console.error(error)
  }
}

async function scrapeSnapshot() {
  let url: string
  let client: GraphQLClient
  let spaces: string[]

  try {
    url = process.env.GRAPHQL_ENDPOINT
    client = new GraphQLClient({ url })
  } catch (error) {
    console.log('Missing env variable $GRAPHQL_ENDPOINT')
    return exit(1)
  }

  try {
    spaces = process.env.SPACES.split(',')
  } catch (error) {
    console.log('Missing env variable $SPACES')
    return exit(1)
  }

  await getProposals(client, spaces)
  await getVotes(client)
}

scrapeSnapshot()
