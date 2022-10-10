//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract NFTMarketplace {
    struct Listing {
        uint256 price;
        address seller;
    }

    mapping(address => mapping(uint => Listing)) public listings;

    event ListingCreated(
        address nftAddress,
        uint256 tokenId,
        uint256 price,
        address seller
    );

    event ListingCanceled(
        address nftAddress,
        uint256 tokenId,
        address seller
    );

    event ListingUpdated(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice,
        address seller
    );

    event ListingPurchased(
        address nftAddress,
        uint256 tokenId,
        address seller,
        address buyer
    );
    
    modifier isNFTOwner(address nftAddress, uint256 tokenId) {
        require(
            IERC721(nftAddress).ownerOf(tokenId) == msg.sender, 
            "MRKT: Not the owner"
        );
        _; 
    }

    modifier isNotListed(address nftAddress, uint256 tokenId) {
        require(
            listings[nftAddress][tokenId].price == 0,
            "MRKT: NFT already listed"    
        );
        _;
    }

    modifier isListed(address nftAddress, uint256 tokenId) {
        // if listing already existed, listing.price != 0
        require(
            listings[nftAddress][tokenId].price > 0,
            "MRKT: NFT already listed"    
        );
        _;
    }

    function createListing(address nftAddress, uint256 tokenId, uint256 price) 
        external 
        isNFTOwner(nftAddress, tokenId) 
        isListed(nftAddress, tokenId) 
    {
        require(price > 0, "MRKT: Price must be more than 0");
        IERC721 nftContract = IERC721(nftAddress);
        require(
            nftContract.isApprovedForAll(msg.sender, address(this)) || 
            nftContract.getApproved(tokenId) == address(this), 
            "MRKT: No approval for NFT"
        );
        // create a new listing 
        listings[nftAddress][tokenId] = Listing({
            price: price,
            seller: msg.sender
        });

        emit ListingCreated(nftAddress, price, tokenId, msg.sender);
    }

    function cancelListing(address nftAddress, uint256 tokenId) 
        external
        isNFTOwner(nftAddress, tokenId)
        isListed(nftAddress, tokenId)
    {
        // delete the listing struct from the mapping
        delete listings[nftAddress][tokenId];

        emit ListingCanceled(nftAddress, tokenId, msg.sender);
    }

    function updateListing(address nftAddress, uint256 tokenId, uint256 newPrice) 
        external 
        isNFTOwner(nftAddress, tokenId)
        isListed(nftAddress, tokenId) 
    {
        require(newPrice > 0, "MRKT: Price must be greater than 0");
        // update the listing price
        listings[nftAddress][tokenId].price = newPrice;

        emit ListingUpdated(nftAddress, tokenId, newPrice, msg.sender);
    }

    function purchaseListing(address nftAddress, uint256 tokenId) 
        external 
        payable 
        isListed(nftAddress, tokenId)
    {
        // load the listing in a local copy 
        Listing memory listing = listings[nftAddress][tokenId];
        require(msg.value == listing.price, "MRKT: Incorrect ETH supplied");

        // delete listing from storage
        delete listings[nftAddress][tokenId];
        // transfer NFT from seller to buyer
        IERC721(nftAddress).safeTransferFrom(
            listing.seller, 
            msg.sender, 
            tokenId
        );

        // transfer ETH from buyer to seller 
        (bool sent, ) = payable(listing.seller).call{value: msg.value}("");
        require(sent, "Failed to transfer ETH");

        emit ListingPurchased(nftAddress, tokenId, listing.seller, msg.sender);
    }

}