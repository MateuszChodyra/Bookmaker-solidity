const { assert } = require('chai');

const Betting = artifacts.require("Betting");

var expect = require('chai').expect;

contract("Betting - part 3 - setMatchResult", (accounts) => {

    let [owner, alice] = accounts;
    let timestampNow = Math.floor(Date.now()/1000);
    
    let contractInstance;
    beforeEach(async () => {
        contractInstance = await Betting.new();
        
        await contractInstance.createCategory('Football', {from: owner});

        await contractInstance.createMatch("TEAM_A", "TEAM_B", 200, 200, 200, timestampNow+1000, 0, {from: owner});
        await contractInstance.createMatch("TEAM_C", "TEAM_D", 200, 200, 200, timestampNow+1000, 0, {from: owner});
    });

    it("Should be able to set result to unfinished match", async () => {
        let result = await contractInstance.matches(0, {from: owner});
        assert.equal(result.result, '0');
        assert.equal(result.finished, false);

        result = await contractInstance.setMatchResult(0, 1, {from: owner});
        assert.equal(result.receipt.status, true);
        assert.equal(result.logs[0].event, 'MatchResultSettled');
        assert.equal(result.logs[0].args._id.toString(), '0');
        assert.equal(result.logs[0].args._result.toString(), '1');

        result = await contractInstance.matches(0, {from: owner});
        assert.equal(result.result, '1');
        assert.equal(result.finished, true);
    })

    it("It should not be possible to set result to finished match", async () => {
        await contractInstance.setMatchResult(0, 1, {from: owner});
        let err;
        try {
            await contractInstance.setMatchResult(0, 2, {from: owner});
        } catch(ex) {
            err = ex;
        }
        assert.equal(err.reason, 'finished == true');
    })

    it("It should not be possible to set result PENDING (0)", async () => {
        let err;
        try {
            await contractInstance.setMatchResult(0, 0, {from: owner});
        } catch(ex) {
            err = ex;
        }
        assert.equal(err.reason, '_matchResults == PENDING');
    })

    it("It should not be possible for anyone other than the owner to set match result", async () => {
        let err;
        try {
            await contractInstance.setMatchResult(0, 0, {from: alice});
        } catch(ex) {
            err = ex;
        }
        assert.equal(err.reason, 'Ownable: caller is not the owner');
    })
    
})