const { assert } = require('chai');

const Betting = artifacts.require("Betting");

var expect = require('chai').expect;

contract("Betting - part 5 - getUserBets", (accounts) => {

    let [owner, alice] = accounts;
    let timestampNow = Math.floor(Date.now()/1000);
    
    let contractInstance;
    beforeEach(async () => {
        contractInstance = await Betting.new();
        
        await contractInstance.createCategory('Football', {from: owner});

        await contractInstance.createMatch("TEAM_A", "TEAM_B", 200, 200, 200, timestampNow+1000, 0, {from: owner});
        await contractInstance.createMatch("TEAM_C", "TEAM_D", 200, 200, 200, timestampNow+1000, 0, {from: owner});
        await contractInstance.createMatch("TEAM_E", "TEAM_F", 200, 200, 200, timestampNow+1000, 0, {from: owner});

        await contractInstance.betMatches(['0', '1'], ['1', '2'], {from: alice, value: web3.utils.toWei('8', 'ether')});
        await contractInstance.betMatches(['0', '2'], ['1', '1'], {from: alice, value: web3.utils.toWei('8', 'ether')});
    });

    //@TODO
    it("Should be able to get user bets", async () => {
        let result = await contractInstance.getUserBets({from: alice});
        console.log(result)
        console.log(result[0])
    })
})