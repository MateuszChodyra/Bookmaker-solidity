const { assert } = require('chai');

const Betting = artifacts.require("Betting");

var expect = require('chai').expect;

contract("Betting - part 4 - receiveBetPrize", (accounts) => {

    let [owner, alice, bob, charles] = accounts;
    let timestampNow = Math.floor(Date.now()/1000);
    
    let contractInstance;
    beforeEach(async () => {
        contractInstance = await Betting.new();
        
        await contractInstance.createMatch("TEAM_A", "TEAM_B", 200, 200, 200, timestampNow+1000, {from: owner});
        await contractInstance.createMatch("TEAM_C", "TEAM_D", 200, 200, 200, timestampNow+1000, {from: owner});
        await contractInstance.createMatch("TEAM_E", "TEAM_F", 200, 200, 200, timestampNow+1000, {from: owner});

        await contractInstance.betMatches(['0'], ['1'], {from: alice, value: web3.utils.toWei('1', 'ether')});
        await contractInstance.betMatches(['0', '1'], ['1', '1'], {from: bob, value: web3.utils.toWei('1', 'ether')});
        await contractInstance.betMatches(['0', '1'], ['1', '2'], {from: charles, value: web3.utils.toWei('8', 'ether')});
        await contractInstance.betMatches(['0', '2'], ['1', '1'], {from: charles, value: web3.utils.toWei('8', 'ether')});

        await contractInstance.setMatchResult(0, 1, {from: owner});
        await contractInstance.setMatchResult(1, 1, {from: owner});
    });

    it("Should be able to receive prize from winning bet", async () => {
        let result = await contractInstance.receiveBetPrize(0, {from: alice});
        assert.equal(result.receipt.status, true);
        assert.equal(result.logs[0].event, 'BetPrizeReceived');
        assert.equal(result.logs[0].args._id.toString(), '0');
        assert.equal(result.logs[0].args._prize.toString(), web3.utils.toWei('1.9', 'ether'));

        //@TODO assert that alice received 1.9eth
        //@TODO assert that owner received 0.02eth
    })

    it("Should be able to receive prize from AKO winning bet (multi matches bet)", async () => {
        let result = await contractInstance.receiveBetPrize(1, {from: bob});
        assert.equal(result.receipt.status, true);
        assert.equal(result.logs[0].event, 'BetPrizeReceived');
        assert.equal(result.logs[0].args._id.toString(), '1');
        assert.equal(result.logs[0].args._prize.toString(), web3.utils.toWei('3.8', 'ether'));

        //@TODO assert that bob received 3.8eth
        //@TODO assert that owner received 0.04eth
    })

    it("It should not be possible to receive prize from losing bet", async () => {
        let err;
        try {
            await contractInstance.receiveBetPrize(2, {from: charles});
        } catch(ex) {
            err = ex;
        }
        assert.equal(err.reason, 'result');
    })

    it("It should not be possible to receive prize two times", async () => {
        await contractInstance.receiveBetPrize(0, {from: alice});
        let err;
        try {
            await contractInstance.receiveBetPrize(0, {from: alice});
        } catch(ex) {
            err = ex;
        }
        assert.equal(err.reason, 'received != false');
    })

    it("It should not be possible to receive prize for someone else that bet owner", async () => {
        let err;
        try {
            await contractInstance.receiveBetPrize(1, {from: alice});
        } catch(ex) {
            err = ex;
        }
        assert.equal(err.reason, 'betToOwner[_betId] != msg.sender');
    })

    it("It should not be possible to receive prize for bet with unfinished match", async () => {
        let err;
        try {
            await contractInstance.receiveBetPrize(3, {from: charles});
        } catch(ex) {
            err = ex;
        }
        assert.equal(err.reason, 'finished != true');
    })
})