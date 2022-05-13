const { expect } = require("chai");
const { ethers } = require('hardhat');
// const { BigNumber } = require("ethers")

describe("Wallet", function () {

    var Wallet, wallet, userA, userB, userC, notApproverUser, deployer;

    before(async function () {
        signers = await ethers.getSigners()
        deployer = signers[0]
        userA = signers[1]
        userB = signers[2]
        userC = signers[3]
        notApproverUser = signers[4]
        Wallet = await ethers.getContractFactory("Wallet")
    })

    describe("deployment", function () {

        before(async function () {
            wallet = await Wallet.deploy([userA.address, userB.address], 1);
            await wallet.deployed()
        })

        it("address is correct", async function () {

            const address = await wallet.address

            expect(address).not.to.equal(0x0)
            expect(address).not.to.equal('')
            expect(address).not.to.equal('0x0000000000000000000000000000000000000000')
            expect(address).not.to.equal(null)
            expect(address).not.to.equal(undefined)
        });

        it("approvers are correct", async function () {

            const approvers = await wallet.getApprovers()

            expect(approvers[0]).to.equal(userA.address)
            expect(approvers[1]).to.equal(userB.address)
        });

        it("quorum is correct", async function () {

            const quorum = await wallet.quorum()

            expect(quorum).to.equal(1)
        });
    })


    describe("createTransfer", function () {

        var result, weiToTransfer;

        before(async function () {
            wallet = await Wallet.deploy([userA.address, userB.address], 1);
            await wallet.deployed()
            weiToTransfer = ethers.utils.parseEther('10');
            result = await wallet.connect(userA).createTransfer(weiToTransfer, userC.address)
        })

        it("should add transfer to list", async function () {

            var transfersAmount = (await wallet.getTransfers()).length
            var transfer = (await wallet.getTransfers())[0]


            expect(transfersAmount).to.equal(1)
            expect(transfer.id).to.equal(0)
            expect(transfer.amount).to.equal(weiToTransfer)
            expect(transfer.to).to.equal(userC.address)
            expect(transfer.approvals).to.equal(0)
            expect(transfer.sent).to.equal(false)
        });

        it("should emit event", async function () {

            await expect(result)
                .to.emit(wallet, "TransferCreated")
                .withArgs(0, ethers.utils.parseEther('10'), userC.address)

        });

        it("should revert if not an approver", async function () {
            await expect(wallet.connect(notApproverUser).createTransfer(weiToTransfer, userC.address)).to.be.revertedWith('not allowed, not an approver')
        });

    })

    describe("approveTransfer", function () {

        var result, weiToTransfer;

        beforeEach(async function () {
            // await deployer.sendTransaction(
            //     {
            //         to: wallet.address,
            //         value: 100
            //     }
            // )
            wallet = await Wallet.deploy([userA.address, userB.address], 1);
            await wallet.deployed()
            weiToTransfer = ethers.utils.parseEther('10');
            await wallet.connect(userA).createTransfer(weiToTransfer, userC.address)
            result = await wallet.connect(userA).approveTransfer(0)
        })

        it("should emit TransferApproved event", async function () {
            await expect(result)
                .to.emit(wallet, "TransferApproved")
                .withArgs(0, userA.address)
        });

        it("should change approvals", async function () {
            expect(await wallet.approvals(userA.address, 0)).to.be.true
        });

        it("should sent transfer is approvals > quorum", async function () {

            const userCstartBalance = await ethers.provider.getBalance(userC.address);

            const lastApproval = await wallet.connect(userB).approveTransfer(0)
            const approvals = ((await wallet.transfers(0)).approvals).toNumber()

            expect(approvals).to.be.greaterThan(1)

            await expect(lastApproval)
                .to.emit(wallet, "TransferSent")
                .withArgs(0)

            const userCendBalance = await ethers.provider.getBalance(userC.address);

            console.log(userCstartBalance)
            console.log(weiToTransfer)
            console.log(userCendBalance)
            console.log(userCstartBalance.add(weiToTransfer))


            expect(userCstartBalance.add(weiToTransfer).toNumber()).to.be.equal(userCendBalance.toNumber())

        });


        it("should revert if transfer already sent", async function () {
            expect((await wallet.transfers(0)).sent).to.be.false
            await wallet.connect(userB).approveTransfer(0)
            expect((await wallet.transfers(0)).sent).to.be.true
            await expect(wallet.connect(userA).approveTransfer(0)).to.be.revertedWith('transfer already sent')
        });

        it("should revert if approving twice for same user", async function () {
            await expect(wallet.connect(userA).approveTransfer(0)).to.be.revertedWith('transfer already approved')
        });

        it("should revert if not an approver", async function () {
            await expect(wallet.connect(notApproverUser).approveTransfer(0)).to.be.revertedWith('not allowed, not an approver')
        });

    })


})
