import { useEffect, useState }  from "react"
import { useAccount, useContract, useProvider, erc721ABI } from "wagmi"
import styles from "../styles/Listing.module.css"
import { formatEther } from "ethers.lib.utils"

export default function Listing(props) {
    return(
        <div>
            {loading ? (
                <span>Loading...</span>
            ) : (
                <div className={styles.card}>
                    <img src={imageURI} />
                    <div className={styles.container}>
                        <span>
                            <b>{name} - {props.tokenId}</b>
                        </span>
                        <span>Price: {formatEther(props.price)} CELO</span>
                        <span>Seller: {isOwner ? "You" : props.seller.subString(0, 6) + "..."}</span>
                    </div>
                </div>
            )}
        </div>
    );
}