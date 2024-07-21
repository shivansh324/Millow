const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => { //covert currency to tokens
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Escrow', () => {//put all the tests here for escrow contract

    let buyer, seller, inspector, lender
    let realEstate, escrow

    beforeEach(async () => {
        //Setup accounts
        //getSigners get the free avaiable accounts for testting purpose
        [buyer, seller, inspector, lender] = await ethers.getSigners()

        //Deploy real estate 
        const RealEstate = await ethers.getContractFactory('RealEstate')
        realEstate = await RealEstate.deploy()

        //Mint
        let transaction = await realEstate.connect(seller).mint("https://ipfs.io/ipfs/QmQUozrHLAusXDxrvsESJ3PYB3rUeUuBAvVWw6nop2uu7c/1.png")
        await transaction.wait()

        const Escrow = await ethers.getContractFactory('Escrow')
        escrow = await Escrow.deploy(realEstate.address,
            seller.address, inspector.address, lender.address
        )

        // //Approve property to send through listing
        transaction = await realEstate.connect(seller).approve(escrow.address, 1);
        await transaction.wait()

        //List Property
        transaction = await escrow.connect(seller).list(1, buyer.address, tokens(10), tokens(5))
        await transaction.wait()
    })

    describe('Deployment', () => {
        it("Return NFT address", async () => {
            const result = await escrow.nftAddress();
            expect(result).to.be.equal(realEstate.address)
        })
        it("Return Seller address", async () => {
            const result = await escrow.seller();
            expect(result).to.be.equal(seller.address)
        })
        it("Return Inspector address", async () => {
            const result = await escrow.inspector();
            expect(result).to.be.equal(inspector.address)
        })
        it("Return Lender address", async () => {
            const result = await escrow.lender();
            expect(result).to.be.equal(lender.address)
        })
    })

    describe('Listing', () => {
        it("Updates as lsited", async () => {
            const result = await escrow.isListed(1)
            expect(result).to.be.equal(true)
        })

        it("Update the ownership", async () => {
            expect(await realEstate.ownerOf(1)).to.be.equal(escrow.address)
        })

        it("Return buyer", async () => {
            const result = await escrow.buyer(1)
            expect(result).to.be.equal(buyer.address)
        })
        it("Return Purchase Price", async () => {
            const result = await escrow.purchasePrice(1)
            expect(result).to.be.equal(tokens(10))
        })
        it("Return Escrow Amount", async () => {
            const result = await escrow.escrowAmount(1)
            expect(result).to.be.equal(tokens(5))
        })
    })

    describe('Deposits', () => {
        it("Updates contact balance", async () => {
            const transaction = await escrow.connect(buyer).depositEarnest(1, {value: tokens(5)})
            await transaction.wait()
            const result = await escrow.getBalance()
            expect(result).to.be.equal(tokens(5))
        })
    })

})

