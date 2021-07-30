import axios from 'axios'
import fs from 'fs'

async function getProposals() {
  try {
    // This returns a JSON file from the snapshot hub, NOT an actual IPFS file stored on an IPFS node
    // It contains all proposals. Therefore we take the IPFS files from this list and query a public gateway
    // Snapshot posts their IPFS files to many public nodes, list is here https://github.com/snapshot-labs/snapshot.js/blob/master/src/gateways.json
    const response = await axios.get('https://hub.snapshot.page/api/balancer/proposals')
    const data = response.data

    for (const proposal in data) {
      const relayerIpfsHash = data[proposal].relayerIpfsHash
      const proposals = fs.readFileSync('./data/proposals.txt', 'utf8')
      const duplicateProposal = proposals.includes(proposal)
      if (duplicateProposal) {
        console.log(`Duplicate proposal    : ${proposal}`)
      } else {
        fs.appendFileSync('./data/proposals.txt', proposal + '\n')
        console.log(`Added proposal        : ${proposal} to proposals.txt`)
      }

      const relayers = fs.readFileSync('./data/proposals-relayers.txt', 'utf8')
      const duplicateRelayerIpfsHash = relayers.includes(relayerIpfsHash)
      if (duplicateRelayerIpfsHash) {
        console.log(`Duplicate relayer hash: ${relayerIpfsHash}`)
      } else {
        fs.appendFileSync('./data/proposals-relayers.txt', relayerIpfsHash + '\n')
        console.log(
          `Added relayer hash    : ${relayerIpfsHash} to proposals-relayers.txt`,
        )
      }
    }
  } catch (error) {
    console.error(error)
  }
}

async function getVotes() {
  try {
    const proposals = fs.readFileSync('./data/proposals.txt', 'utf8').split('\n')
    proposals.pop() // remove final new line
    console.log(proposals)

    // Here  we query for the proposal votes
    // Note - if no votes have been created, it will just return an empty object
    for (const proposal of proposals) {
      const response = await axios.get(
        `https://hub.snapshot.page/api/balancer/proposal/${proposal}`,
      )
      const data = response.data

      // Once we grab the proposal, from this end point, we need to parse out all of the
      // IPFS hashes, and add them to a txt file for ipfs-sync
      for (const vote in data) {
        // For the votes we must get the authorIpfsHash and relayerIpfsHash
        // These files have stored data to relate them back to the proposal, so no need to store special information
        const authorIpfsHash = data[vote].authorIpfsHash
        const relayerIpfsHash = data[vote].relayerIpfsHash

        const votes = fs.readFileSync('./data/votes.txt', 'utf8')
        const duplicateVote = votes.includes(authorIpfsHash)
        if (duplicateVote) {
          console.log(`Duplicate vote        : ${authorIpfsHash}`)
        } else {
          fs.appendFileSync('./data/votes.txt', authorIpfsHash + '\n')
          console.log(`Added vote            : ${proposal} to votes.txt`)
        }

        const relayers = fs.readFileSync('./data/votes-relayers.txt', 'utf8')
        const duplicateRelayerIpfsHash = relayers.includes(relayerIpfsHash)
        if (duplicateRelayerIpfsHash) {
          console.log(`Duplicate relayer hash: ${relayerIpfsHash}`)
        } else {
          fs.appendFileSync('./data/votes-relayers.txt', relayerIpfsHash + '\n')
          console.log(`Added relayer hash    : ${relayerIpfsHash} to votes-relayers.txt`)
        }
      }
    }
  } catch (error) {
    console.error(error)
  }
}

async function scrapeSnapshot() {
  await getProposals()
  await getVotes()
}

scrapeSnapshot()
