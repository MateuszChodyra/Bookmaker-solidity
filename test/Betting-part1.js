const { assert } = require('chai');

const Betting = artifacts.require("Betting");

var expect = require('chai').expect;

contract("Betting - part 1 - createMatch", (accounts) => {

    let [owner, alice] = accounts;
    let timestampNow = Math.floor(Date.now()/1000);
    
    let contractInstance;
    beforeEach(async () => {
        contractInstance = await Betting.new();
    });

    it("Should be able to create a new match", async () => {
        const result = await contractInstance.createMatch("TEAM_A", "TEAM_B", 200, 200, 200, timestampNow+100, {from: owner});
        expect(result.receipt.status).to.equal(true);

        assert.equal(result.logs[0].event, 'MatchCreated');
        assert.equal(result.logs[0].args._id.toString(), '0');
        
        const result2 = await contractInstance.matches(result.logs[0].args._id.toString(), {from: owner});
        assert.equal(result2.teamAName.toString(), 'TEAM_A');
    })

    it("It should not be possible for anyone other than the owner to create a new match", async () => {
        let err;
        try {
            const result = await contractInstance.createMatch("TEAM_A", "TEAM_B", 200, 200, 200, timestampNow+100, {from: alice});
        } catch(ex) {
            err = ex;
        }
        assert.equal(err.reason, 'Ownable: caller is not the owner');
    })

    it("It should not be possible to create a new match with the same team names", async () => {
        let err;
        try {
            const result = await contractInstance.createMatch("TEAM_A", "TEAM_A", 200, 200, 200, timestampNow+100, {from: owner});
        } catch(ex) {
            err = ex;
        }
        assert.equal(err.reason, 'Team names not unique');
    })

    it("It should not be possible to create a new match with rateA under 101", async () => {
        let err;
        try {
            const result = await contractInstance.createMatch("TEAM_A", "TEAM_B", 100, 200, 200, timestampNow+100, {from: owner});
        } catch(ex) {
            err = ex;
        }
        assert.equal(err.reason, '_rateA');
    })

    it("It should not be possible to create a new match with rateB under 101", async () => {
        let err;
        try {
            const result = await contractInstance.createMatch("TEAM_A", "TEAM_B", 200, 100, 200, timestampNow+100, {from: owner});
        } catch(ex) {
            err = ex;
        }
        assert.equal(err.reason, '_rateB');
    })

    it("It should not be possible to create a new match with rateDraw under 101", async () => {
        let err;
        try {
            const result = await contractInstance.createMatch("TEAM_A", "TEAM_B", 200, 200, 100, timestampNow+100, {from: owner});
        } catch(ex) {
            err = ex;
        }
        assert.equal(err.reason, '_rateDraw');
    })

    it("It should not be possible to create a new match with endBetTime from the past", async () => {
        let err;
        try {
            const result = await contractInstance.createMatch("TEAM_A", "TEAM_B", 200, 200, 200, timestampNow-1000, {from: owner});
        } catch(ex) {
            err = ex;
        }
        assert.equal(err.reason, '_endBetTime');
    })
})