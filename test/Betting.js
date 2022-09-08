const { assert } = require('chai');

const Betting = artifacts.require("Betting");

var expect = require('chai').expect;

contract("Betting", (accounts) => {

    let [owner, alice, bob] = accounts;
    
    let contractInstance;
    beforeEach(async () => {
        contractInstance = await Betting.new();
    });

    it("Should be able to create a new match", async () => {
        const result = await contractInstance.createMatch("TEAM_A", "TEAM_B", 200, 200, 200, Date.now()+100, {from: owner});
        expect(result.receipt.status).to.equal(true);
    })

    it("It should not be possible for anyone other than the owner to create a new match", async () => {
        try {
            const result = await contractInstance.createMatch("TEAM_A", "TEAM_B", 200, 200, 200, Date.now()+100, {from: alice});
            assert(false);
        } catch(err) {
            assert(err);
        }
    })

    it("It should not be possible to create a new match with the same team names", async () => {
        try {
            const result = await expectRevert(contractInstance.createMatch("TEAM_A", "TEAM_A", 200, 200, 200, Date.now()+100, {from: owner}));
            assert(false);
        } catch(err) {
            assert(err);
        }
    })

    it("It should not be possible to create a new match with rate under 101", async () => {
        try {
            const result = await contractInstance.createMatch("TEAM_A", "TEAM_B", 100, 200, 200, Date.now()+100, {from: owner});
            assert(false);
        } catch(err) {
            assert(err);
        }
    })

    it("It should not be possible to create a new match with endBetTime equal to the present", async () => {
        try {
            const result = await contractInstance.createMatch("TEAM_A", "TEAM_B", 100, 200, 200, Date.now(), {from: owner});
            assert(false);
        } catch(err) {
            assert(err);
        }
    })

    it("It should not be possible to create a new match with endBetTime from the past", async () => {
        try {
            const result = await contractInstance.createMatch("TEAM_A", "TEAM_B", 100, 200, 200, Date.now()-100, {from: owner});
            assert(false);
        } catch(err) {
            assert(err);
        }
    })

})