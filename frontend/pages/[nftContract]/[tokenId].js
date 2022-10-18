import { Contract } from 'ethers'
import { formatEther, parseEther } from 'ethers/lib/utils'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { createClient } from 'urql'
import { useContract, useSigner, erc721ABI } from 'wagmi'
import MarketplaceABI from '../../abis/NFTMarketplace.json'
import Navbar from '../../component/Navbar'
import { MARKETPLACE_ADDRESS, SUBGRAPH_URL } from '../../constants'
import styles from '../../styles/Details.module.css'

export default function NFTDetails() {
    // get the nft contract address and token ID from url
    const router = useRouter()
    const nftAddress = router.query.nftAddress
    const tokenId = router.query.tokenId

    const [listing, setListing] = useState()
    const [name, setName] = useState("")
    const [imageURI, setImageURI] = useState("")
    const [isOwner, setIsOwner] = useState(false)
    const [isActive, setIsActive] = useState(false)

    const [newPrice, setNewPrice] = useState("")

    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [cancelling, setCancelling] = useState(false)
    const [buying, setBuying] = useState(false)

    const { data: signer } = useSigner()

    const MarketplaceContract = useContract({
        addressOrName: MARKETPLACE_ADDRESS,
        contractInterface: MarketplaceABI,
        signerOrProvider: signer,
    })

    async function fetchListing() {
        const listingQuery = `
            query ListingQuery {
                listingEntities(where: {
                    nftAddress: "${nftAddress}",
                    tokenId: "${tokenId}",
                }) {
                    id
                    nftAddress
                    tokenId
                    price
                    seller
                    buyer
                }
            }
        `

        const urqlClient = createClient({ url: SUBGRAPH_URL })

        const response = await urqlClient.query(listingQuery).toPromise()
        const listingEntities = response.data.listingEntities

        if(listingEntities.length == 0) {
            window.alert("listing does not exist")
            return router.push("/")
        }

        const listing = listingEntities[0]

        const address = await signer.getAddress()

        setIsActive(listing.buyer == null)
        setIsOwner(address.toLowerCase() === listing.seller.toLowerCase())
        setListing(listing)
    }

    async function fetchNFTDetails() {
        const ERC721Contract = new Contract(nftAddress, erc721ABI, signer)
        let tokenURI = await ERC721Contract.tokenURI(tokenId)
        tokenURI = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/")

        const metadata = await fetch(tokenURI)
        const metadataJSON = await metadata.json()

        let image = metadataJSON.imageUrl
        image = image.replace("ipfs://", "https://ipfs.io/ipfs/")

        setName(metadataJSON.name)
        setImageURI(image)
    }

    async function updateListing() {
        setUpdating(true)
        const updateTxn = await MarketplaceContract.cancelListing(
            nftAddress,
            tokenId,
            parseEther(newPrice)
        )
        await updateTxn.wait()
        await fetchListing()
        setUpdating(false)
    }

    async function cancelListing() {
        setCancelling(true)
        const cancelTxn = await MarketplaceContract.cancelListing(
            nftAddress,
            tokenId
        )
        await cancelTxn.wait()
        window.alert("Listing canceled")
        await router.push("/")
        setCancelling(false)
    }

    async function buyListing() {
        setBuying(true)
        const buyTxn = await MarketplaceContract.purchaseListing(
            nftAddress,
            tokenId, 
            {
                value: listing.price
            }
        )
        await buyTxn.wait()
        await fetchListing()
        setBuying(false)
    }

    useEffect(() => {
        if(router.query.nftContract && router.query.tokenId && signer) {
            Promise.all([fetchListing(), fetchNFTDetails()]).finally(() => setLoading(false))
        }
    }, [router, signer])

    return (
        <>
            <Navbar />
            <div>
                {loading ? (
                    <span>Loading...</span>
                ) : (
                    <div className={styles.container}>
                        <div className={styles.details}>
                            <img src={imageURI} />
                            <span>
                                <b>
                                    {name} = #{tokenId}
                                </b>
                            </span>
                            <span>Price: {formatEther(listing.price)} CELO</span>
                            <span>
                            <a
                                href={`https://alfajores.celoscan.io/address/${listing.seller}`}
                                target="_blank"
                            >
                                Seller:{" "}
                                {isOwner ? "You" : listing.seller.substring(0, 6) + "..."}
                            </a>
                            </span>
                            <span>Status: {listing.buyer === null ? "Active" : "Sold"}</span>
                        </div>
                    </div>
                )}
            </div>  
        </>
    )

}