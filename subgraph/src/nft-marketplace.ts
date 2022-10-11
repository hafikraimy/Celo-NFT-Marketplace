import {
  ListingCanceled,
  ListingCreated,
  ListingPurchased,
  ListingUpdated
} from "../generated/NFTMarketplace/NFTMarketplace"
import { store } from "@graphprotocol/graph-ts"
import { ListingEntity } from "../generated/schema"

export function handleListingCanceled(event: ListingCanceled): void {
  const id =   
    event.params.nftAddress.toHex() + "-" + 
    event.params.tokenId.toString() + "-" + 
    event.params.seller.toHex();

  let listing = ListingEntity.load(id);

  if(listing) {
    // store is imported from The Graph libraries
    store.remove("ListingEntity", id);
  }
}

export function handleListingCreated(event: ListingCreated): void {
  // create a unique id that refers to this listing
  const id = 
    event.params.nftAddress.toHex() + "-" + 
    event.params.tokenId.toString() + "-" + 
    event.params.seller.toHex();

    // create a new listing and assign its ID
    let listing = new ListingEntity(id);
    // assign values to entity
    listing.seller = event.params.seller;
    listing.nftAddress = event.params.nftAddress;
    listing.tokenId = event.params.tokenId;
    listing.price = event.params.price;

    // save the listing to the node
    listing.save()
}

export function handleListingPurchased(event: ListingPurchased): void {
  // create a unique id that refers to this listing
  const id = 
    event.params.nftAddress.toHex() + "-" + 
    event.params.tokenId.toString() + "-" + 
    event.params.seller.toHex();

  let listing = ListingEntity.load(id);

  if(listing) {
    // set the buyer
    listing.buyer = event.params.buyer;
    listing.save();
  }

}

export function handleListingUpdated(event: ListingUpdated): void {
  const id = 
    event.params.nftAddress.toHex() + "-" + 
    event.params.tokenId.toString() + "-" + 
    event.params.seller.toHex();

  let listing = ListingEntity.load(id);

  if(listing) {
    // save the price
    listing.price = event.params.newPrice;

    listing.save();
  }
}
