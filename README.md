# Snapshot Governance
Scrapes snapshot to pin the IPFS files to your own node.

# How to Run

Copy and rename `.env.example` to `.env` and replace the variables with their corresponding values.
```sh
cp .env.example .env 
```
Scrape Snapshot API and sync files to IPFS
```sh
make scrape
```

# How it works

- `scrape.ts` hits snapshots API to get all the proposals
- It writes the file proposals.txt to use for `ipfs-sync`
- It then gets all the votes from the proposals from snapshots api
- It writes the file votes.txt
- It then runs `ipfs-sync` on these four files
- All the scripts are de-dupped so that this could run on a VM in the cloud, ping it once a day,
  and it will only append to the txt files. Then ipfs-sync already skips over dupes.