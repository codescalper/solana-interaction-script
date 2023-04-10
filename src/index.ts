//Addng import statements

import * as Web3 from '@solana/web3.js';
import * as fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();
const PROGRAM_ID = new Web3.PublicKey("ChT1B39WKLS8qUrkLvFDXMhEJ4F1XZzwUNHUt4AU9aVa")
const PROGRAM_DATA_PUBLIC_KEY = new Web3.PublicKey("Ah9K7dQ8EHaZqcAsgBW8w37yN2eAy3koFmUn4x3CJtod")

async function main() {
    const connection = new Web3.Connection(Web3.clusterApiUrl('devnet'));
    const signer = await initializeKeypair(connection);
  
    console.log("Public key:", signer.publicKey.toBase58());
    // await airdropSolIfNeeded(signer, connection);
    await pingProgram(connection, signer)
    
}

//initializeKeypair function which will create a keypair if one don't have it 

async function initializeKeypair(connection: Web3.Connection): Promise<Web3.Keypair> {
  if (!process.env.PRIVATE_KEY) {
    console.log('Generating new keypair... 🗝️');
    const signer = Web3.Keypair.generate();  //private key is used to sign the transaction

    console.log('Creating .env file');    //.env files contain key value pair -- The purpose is to store the sensitive and config specific data structores
    fs.writeFileSync('.env', `PRIVATE_KEY=[${signer.secretKey.toString()}]`); //fs (file system) module is used to interact with the file system in the computer 
    //and it takes two paramter name of the file and content of the file

    return signer;
  }

  const secret = JSON.parse(process.env.PRIVATE_KEY ?? '') as number[];//If an existing PRIVATE_KEY environment variable is found, it is parsed from a JSON string into a number array and converted into a Uint8Array.
  const secretKey = Uint8Array.from(secret);
  const keypairFromSecret = Web3.Keypair.fromSecretKey(secretKey);
  return keypairFromSecret;
}

async function pingProgram(connection: Web3.Connection, payer: Web3.Keypair) {
  
  const transaction = new Web3.Transaction()
  const instruction = new Web3.TransactionInstruction({
    // Instructions need 3 things 
    
    // 1. The public keys of all the accounts the instruction will read/write
    keys: [
      {
        pubkey: PROGRAM_DATA_PUBLIC_KEY,
        isSigner: false,  //writer doesn't require signature from data accounts
        isWritable: true  //cause the account is being written
      }
    ],
    
    // 2. The ID of the program this instruction will be sent to
    programId: PROGRAM_ID
    
    // 3. Data - in this case, there's none!
  })

  // Here we,
  // we make a transaction
  // we make an instruction
  // we add the instruction to the transaction
  // we send the transaction to the network!

  transaction.add(instruction)
  const transactionSignature = await Web3.sendAndConfirmTransaction(connection, transaction, [payer]) 

  console.log(
    `Transaction https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet` //check the status of our transaction on solana explorer
    )
}

async function airdropSolIfNeeded(
  signer: Web3.Keypair,
  connection: Web3.Connection
) {
  const balance = await connection.getBalance(signer.publicKey); //self ezplanatory
  console.log('Current balance is', balance / Web3.LAMPORTS_PER_SOL, 'SOL');

  
  if (balance / Web3.LAMPORTS_PER_SOL < 1) { //if balance is less than one sol here i have taken one sol because the transaction fees for solana is preety less and 1 sol is enough for making any transaction  :)
    
    console.log('Airdropping 1 SOL');
    const airdropSignature = await connection.requestAirdrop(
      signer.publicKey,
      Web3.LAMPORTS_PER_SOL 
    );

    const latestBlockhash = await connection.getLatestBlockhash();

    await connection.confirmTransaction({
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      signature: airdropSignature,
    });

    const newBalance = await connection.getBalance(signer.publicKey);
    console.log('New balance is', newBalance / Web3.LAMPORTS_PER_SOL, 'SOL');
  }
  
}


main()
    .then(() => {
        console.log("Finished successfully")
        process.exit(0)
    })
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })

   
