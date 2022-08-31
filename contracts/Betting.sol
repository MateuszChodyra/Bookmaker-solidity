// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/access/Ownable.sol";

//@TODO DevFee
//@TODO CANCELED MatchResult
//@TODO onlyOwner withdrawal
//@TODO Oracle implementation
contract Betting is Ownable {

  enum MatchResult{ PENDING, TEAM_A, TEAM_B, DRAW }

  struct Match {
    string teamAName;
    string teamBName;
    uint16 rateA;
    uint16 rateB;
    uint16 rateDraw;
    uint64 endBetTime;
    MatchResult result;
    bool finished;
  }

  struct Bet {
    uint value;
    MatchResult result;
    bool received;
  }

  Match[] public matchs;

  mapping (uint => mapping(address => Bet)) Bets;

  function createMatch(
    string memory _teamAName, 
    string memory _teamBName, 
    uint16 _rateA, 
    uint16 _rateB, 
    uint16 _rateDraw, 
    uint64 _endBetTime) public onlyOwner returns(uint) 
  {
    require(keccak256(bytes(_teamAName)) != keccak256(bytes(_teamBName)));
    require(_rateA > 100, "_rateA");
    require(_rateB > 100, "_rateB");
    require(_rateDraw > 100, "_rateDraw");
    require(_endBetTime > block.timestamp, "_endBetTime");

    matchs.push(Match(_teamAName, _teamBName, _rateA, _rateB, _rateDraw, _endBetTime, MatchResult.PENDING, false));
    return matchs.length - 1;
  }

  function setMatchResult(uint _matchId, MatchResult _matchResult) public onlyOwner {
    require(_matchResult != MatchResult.PENDING);
    require(matchs[_matchId].finished == false);

    matchs[_matchId].result = _matchResult;
    matchs[_matchId].finished = true;
  }

  function betMatch(uint _matchId, MatchResult _matchResult) public payable {
    require(msg.value > 0, "msg.value");
    require(matchs[_matchId].endBetTime > block.timestamp);
    require(_matchResult != MatchResult.PENDING);
    require(Bets[_matchId][msg.sender].value == 0, "Bets");

    Bets[_matchId][msg.sender] = Bet(msg.value, _matchResult, false);
  }

  function receiveMatchPrize(uint _matchId) public payable{
    Bet storage userBet = Bets[_matchId][msg.sender];
    Match memory selectedMatch = matchs[_matchId];

    require(selectedMatch.finished == true);
    require(selectedMatch.result == userBet.result);
    require(userBet.received == false);

    uint16 rate = 0;
    if (userBet.result == MatchResult.TEAM_A) rate = selectedMatch.rateA;
    if (userBet.result == MatchResult.TEAM_B) rate = selectedMatch.rateB;
    if (userBet.result == MatchResult.DRAW) rate = selectedMatch.rateDraw;

    userBet.received = true;
    payable(msg.sender).transfer(userBet.value*(rate/100));
  }

}
