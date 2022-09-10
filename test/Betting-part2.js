const { assert } = require('chai');

const Betting = artifacts.require("Betting");

var expect = require('chai').expect;
const time = require("./helpers/time");

contract("Betting - part 2 - betMatches", (accounts) => {

    let [owner, alice] = accounts;
    let timestampNow = Math.floor(Date.now()/1000);
    
    let contractInstance;
    beforeEach(async () => {
        contractInstance = await Betting.new();
        
        await contractInstance.createMatch("TEAM_A", "TEAM_B", 200, 200, 200, timestampNow+5000, {from: owner});
        await contractInstance.createMatch("TEAM_C", "TEAM_D", 200, 200, 200, timestampNow+5000, {from: owner});
    });

    it("Should be able to bet one match", async () => {
        const result = await contractInstance.betMatches(['0'], ['1'], {from: alice, value: web3.utils.toWei('1', 'ether')});
        expect(result.receipt.status).to.equal(true);

        assert.equal(result.logs[0].event, 'BetCreated');
        assert.equal(result.logs[0].args._id.toString(), '0');
        
        const result2 = await contractInstance.betToOwner(result.logs[0].args._id.toString(), {from: alice});
        assert.equal(result2.toString(), alice);
    })

    it("Should be able to bet AKO (multi matches bet)", async () => {
        const result = await contractInstance.betMatches(['0', '1'], ['1', '1'], {from: alice, value: web3.utils.toWei('1', 'ether')});
        expect(result.receipt.status).to.equal(true);

        assert.equal(result.logs[0].event, 'BetCreated');
        assert.equal(result.logs[0].args._id.toString(), '0');
        
        const result2 = await contractInstance.betToOwner(result.logs[0].args._id.toString(), {from: alice});
        assert.equal(result2.toString(), alice);
    })

    it("It should not be possible to bet without value", async () => {
        let err;
        try {
            let result = await contractInstance.betMatches(['0'], ['1'], {from: alice});
        } catch(ex) {
            err = ex;
        }
        assert.equal(err.reason, 'msg.value');

        try {
            result = await contractInstance.betMatches(['0'], ['1'], {from: alice, value: '0'});
        } catch(ex) {
            err = ex;
        }
        assert.equal(err.reason, 'msg.value');
    })

    it("It should not be possible to bet with _matchIds.length != _matchResults.length", async () => {
        let err;
        try {
            let result = await contractInstance.betMatches(['0', '1'], ['1'], {from: alice, value: web3.utils.toWei('1', 'ether')});
        } catch(ex) {
            err = ex;
        }
        assert.equal(err.reason, '_matchIds.length != _matchResults.length');

        try {
            result = await contractInstance.betMatches(['0'], ['1', '1'], {from: alice, value: web3.utils.toWei('1', 'ether')});
        } catch(ex) {
            err = ex;
        }
        assert.equal(err.reason, '_matchIds.length != _matchResults.length');
    })

    it("It should not be possible to bet with PENDING (0) _matchResults", async () => {
        let err;
        try {
            let result = await contractInstance.betMatches(['0'], ['0'], {from: alice, value: web3.utils.toWei('1', 'ether')});
        } catch(ex) {
            err = ex;
        }
        assert.equal(err.reason, '_matchResults == PENDING');
    })

    it("It should not be possible to bet to finished match", async () => {
        await contractInstance.setMatchResult(0, 1, {from: owner});
        let err;
        try {
            let result = await contractInstance.betMatches(['0'], ['1'], {from: alice, value: web3.utils.toWei('1', 'ether')});
        } catch(ex) {
            err = ex;
        }
        assert.equal(err.reason, 'finished != false');
    })

    it("It should not be possible to bet after _endBetTime", async () => {
        await time.increase(time.duration.days(1));
        let err;
        try {
            let result = await contractInstance.betMatches(['0'], ['1'], {from: alice, value: web3.utils.toWei('1', 'ether')});
        } catch(ex) {
            err = ex;
        }
        assert.equal(err.reason, 'endBetTime < block.timestamp');
    })
})