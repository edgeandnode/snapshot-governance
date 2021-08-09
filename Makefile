.PHONY: scrape-snapshot scrape clean ipfs-sync data

ifneq ("$(wildcard .env)","")
	include .env
	export
endif

data: ensure-data data/proposals.txt data/votes.txt

ensure-data:
	mkdir -p data

data/proposals.txt:
	touch data/proposals.txt

data/votes.txt:
	touch data/votes.txt

scrape-snapshot: data
	@echo "Scraping snapshot..."
	yarn scrape-snapshot

ipfs-sync: data ipfs-sync-msg sync-proposals sync-votes

ipfs-sync-msg:
	@echo "Running ipfs-sync..."

sync-proposals:
	ipfs-sync sync-files --from $(SNAPSHOT_IPFS_GATEWAY) --to $(TARGET_IPFS_GATEWAYS) --file-list ./data/proposals.txt --skip-existing

sync-votes:
	ipfs-sync sync-files --from $(SNAPSHOT_IPFS_GATEWAY) --to $(TARGET_IPFS_GATEWAYS) --file-list ./data/votes.txt --skip-existing

scrape: scrape-snapshot ipfs-sync

clean:
	@echo "Deleting data files..."
	rm data/proposals.txt
	rm data/votes.txt
