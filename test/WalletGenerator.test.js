const { expect } = require("chai");
const { ethers } = require('hardhat');

describe.only("WalletGenerator", function () {

    var WalletGenerator, walletGenerator;
    var user, extraUser1, extraUser2;

    before(async function () {
        signers = await ethers.getSigners()
        user = signers[0]
        extraUser1 = signers[1]
        extraUser2 = signers[2]
        WalletGenerator = await ethers.getContractFactory("WalletGenerator")
    })

    describe("deployment", function () {

        before(async function () {
            walletGenerator = await WalletGenerator.deploy();
            await walletGenerator.deployed()
        })

        it("address is correct", async function () {

            const address = await walletGenerator.address

            expect(address).not.to.equal(0x0)
            expect(address).not.to.equal('')
            expect(address).not.to.equal('0x0000000000000000000000000000000000000000')
            expect(address).not.to.equal(null)
            expect(address).not.to.equal(undefined)
        });


    })

    describe("getWalletsForAddress", function () {

        var result;
        before(async function () {
            walletGenerator = await WalletGenerator.deploy();
            await walletGenerator.deployed()
            result = walletGenerator.connect(user).createWallet([user.address, extraUser1.address], 1)
        })


        it("should return correct list size and content", async function () {

            const walletsForAddress = await walletGenerator.getWalletsForAddress(user.address)

            expect(await walletGenerator.wallets(user.address, 0)).to.be.equal(walletsForAddress[0])
            await expect(walletsForAddress.length).to.be.equal(1)
        });



        it("should return empty for new address", async function () {

            const walletsForAddress = await walletGenerator.getWalletsForAddress(extraUser2.address)

            await expect(walletsForAddress.length).to.be.equal(0)
        });


    })

    describe("createWallet", function () {

        var result;
        before(async function () {
            walletGenerator = await WalletGenerator.deploy();
            await walletGenerator.deployed()
            result = walletGenerator.connect(user).createWallet([user.address, extraUser1.address], 1)
        })

        it("should add address to list", async function () {

            const walletsForAddress = await walletGenerator.getWalletsForAddress(user.address)

            expect(await walletGenerator.wallets(user.address, 0)).to.be.equal(walletsForAddress[0])
            await expect(walletsForAddress.length).to.be.equal(1)
        });

        it("should emit event", async function () {

            const newWalletAddress = await walletGenerator.wallets(user.address, 0)

            await expect(result)
                .to.emit(walletGenerator, "WalletCreated")
                .withArgs(newWalletAddress, user.address)

        })
    })





})
