.PHONY: scrape-snapshot scrape clean ipfs-sync data

data: data/proposals.txt data/votes.txt

data/proposals.txt:
	touch data/proposals.txt

data/votes.txt:
	touch data/votes.txt

scrape-snapshot: data
	@echo "Scraping snapshot..."
	yarn scrape-snapshot

ipfs-sync: data
	@echo "Running ipfs-sync..."
	yarn sync-proposals
	yarn sync-votes

scrape: scrape-snapshot ipfs-sync

clean:
	@echo "Deleting data files..."
	rm data/proposals.txt
	rm data/votes.txt
