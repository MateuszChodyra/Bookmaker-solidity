const Betting = artifacts.require("Betting");

// var expect = require('chai').expect;

contract("Betting", (accounts) => {
    
    let contractInstance;
    beforeEach(async () => {
        contractInstance = await Betting.new();
    });

    it("Should be able to create a new match", async () => {

    })

})