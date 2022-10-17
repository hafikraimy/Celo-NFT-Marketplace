import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { useEffect, useState } from 'react'
import Navbar from '../component/Navbar'
import Listing from '../component/Listing'
import { createClient } from 'urql'
import Link from 'next/link'
import { SUBGRAPH_URL } from '../constants'
import { useAccount } from 'wagmi'

export default function Home() {
  const [listings, setListings] = useState();
  const [loading, setLoading] = useState(false);

  const { isConnected } = useAccount();

  async function fetchListings() {
    setLoading(true);
    // the graphQL query to fetch all listings
    const listingsQuery = `
      query ListingsQuery {
        listingEntities {
          id
          nftAddress
          tokenId
          price
          seller
          buyer
        }
      }
    `;

    // create a urql client
    const urqlClient = createClient({
      url: SUBGRAPH_URL,
    })

    // send query to subgraph graphQL API
    const response = await urqlClient.query(listingsQuery).toPromise();
    const listingEntities = response.data.listingEntities;
    // filter out active listing with no buyer
    const activeListings = listingEntities.filter((listing) => listing.buyer === null);

    setListings(activeListings);
    setLoading(false);
  }

  useEffect(() => {
    if(isConnected) {
      fetchListings();
    }
  }, [])

  return (
    <>
      <Navbar />
      {loading && isConnected && <span>Loading...</span>}
      
      {/* render the listings */}
      <div className={styles.container}>
        {!loading && listings && listings.map((listing) => {
          return (
            <Link key={listing.id} href={`/${listing.nftAddress}/${listing.tokenId}`}>
              <a>
                <Listing 
                  nftAddress={listing.nftAddress}
                  tokenId={listing.tokenId}
                  price={listing.price}
                  seller={listing.seller}
                />
              </a>
            </Link>
          );
        })}
      </div>

      {!loading && listings && listings.length === 0 && (
        <span>No listings found</span>
      )}
    </>
  )
}
