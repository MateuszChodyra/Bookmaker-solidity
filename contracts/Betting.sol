// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/access/Ownable.sol";

//@TODO CANCELED MatchResult
//@TODO onlyOwner withdrawal
//@TODO Oracle implementation
contract Betting is Ownable {

  enum MatchResult{ PENDING, TEAM_A, TEAM_B, DRAW }

  event Received(address, uint);
  event CategoryCreated(uint indexed _id, string _categoryName);
  event MatchCreated(uint indexed _id);//TODO all input data
  event BetCreated(uint indexed _id);
  event MatchResultSettled(uint indexed _id, uint _result);
  event BetPrizeReceived(uint indexed _id, uint _prize);

  uint contractFee = 4;
  uint devFee = 1;

  struct Category {
    uint256 id;
    string name;
  }

  struct Match {
    uint256 id;
    string teamAName;
    string teamBName;
    string categoryName;
    uint16 rateA;
    uint16 rateB;
    uint16 rateDraw;
    uint64 endBetTime;
    MatchResult result;
    bool finished;
  }

  struct Bet {
    uint matchId;
    MatchResult result;
  }

  struct MultiBet {
    mapping(uint => Bet) bets;
    uint value;
    bool received;
    uint betsCount;
    uint prize;
  }

  Category[] public categories;

  Match[] public matches;

  MultiBet[] public bets;
  mapping(uint => address) public betToOwner;
  mapping(address => uint[]) public ownerToBets;

  receive() external payable {
    emit Received(msg.sender, msg.value);
  }

  function createCategory(string memory _categoryName) public onlyOwner {
    categories.push(Category(categories.length, _categoryName));
    emit CategoryCreated(categories.length - 1, _categoryName);
  }

  function createMatch(
    string memory _teamAName, 
    string memory _teamBName, 
    uint16 _rateA, 
    uint16 _rateB, 
    uint16 _rateDraw, 
    uint64 _endBetTime,
    uint256 _categoryId) public onlyOwner returns(uint) 
  {
    require(keccak256(bytes(_teamAName)) != keccak256(bytes(_teamBName)), "Team names not unique");
    require(_rateA > 100, "_rateA");
    require(_rateB > 100, "_rateB");
    require(_rateDraw > 100, "_rateDraw");
    require(_endBetTime > block.timestamp, "_endBetTime");

    matches.push(Match(matches.length, _teamAName, _teamBName, categories[_categoryId].name, _rateA, _rateB, _rateDraw, _endBetTime, MatchResult.PENDING, false));
    emit MatchCreated(matches.length - 1);
    return matches.length - 1;
  }

  //@TODO compare gas cost 
  // function setMatchesResults(uint[] calldata _matchIds, MatchResult[] calldata _matchResults) public onlyOwner{
  //   require(_matchIds.length == _matchResults.length, "_matchIds.length != _matchResults.length");
    
  //   uint i = 0;
  //   for (; i < _matchIds.length; i++) {
  //     require(_matchResults[i] != MatchResult.PENDING);
  //     require(matches[_matchIds[i]].finished == false);
  //   }

  //   for (i = 0; i < _matchIds.length; i++) {
  //     matches[_matchIds[i]].result = _matchResults[i];
  //   matches[_matchIds[i]].finished = true;
  //   }
  // }

  function setMatchResult(uint _matchId, MatchResult _matchResult) public onlyOwner {
    require(_matchResult != MatchResult.PENDING, "_matchResults == PENDING");
    require(matches[_matchId].finished == false, "finished == true");

    matches[_matchId].result = _matchResult;
    matches[_matchId].finished = true;

    emit MatchResultSettled(_matchId, uint256(_matchResult));
  }

  function betMatches(uint[] calldata _matchIds, MatchResult[] calldata _matchResults) public payable returns(uint) {
    require(msg.value > 0, "msg.value");
    require(_matchIds.length == _matchResults.length, "_matchIds.length != _matchResults.length");
    
    uint i = 0;
    for (; i < _matchIds.length; i++) {
      require(matches[_matchIds[i]].finished == false, "finished != false");
      require(matches[_matchIds[i]].endBetTime > block.timestamp, "endBetTime < block.timestamp");
      require(_matchResults[i] != MatchResult.PENDING, "_matchResults == PENDING");
    }

    MultiBet storage newMultiBet = bets.push();
    newMultiBet.value = msg.value;
    newMultiBet.received = false;
    newMultiBet.betsCount = 0;

    for (i = 0; i < _matchIds.length; i++) {
      newMultiBet.bets[newMultiBet.betsCount] = Bet(_matchIds[i], _matchResults[i]);
      newMultiBet.betsCount += 1;
    }

    betToOwner[bets.length - 1] = msg.sender;
    ownerToBets[msg.sender].push(bets.length - 1);

    emit BetCreated(bets.length - 1);
    return bets.length - 1;
  }

  function receiveBetPrize(uint _betId) public payable {
    require(msg.value == 0, "msg.value != 0");
    require(betToOwner[_betId] == msg.sender, "betToOwner[_betId] != msg.sender");
    require(bets[_betId].received == false, "received != false");
    
    uint i = 0;
    for (; i < bets[_betId].betsCount; i++) {
      require(matches[bets[_betId].bets[i].matchId].finished == true, "finished != true");
      require(matches[bets[_betId].bets[i].matchId].result == bets[_betId].bets[i].result, "result");
    }

    uint prize = bets[_betId].value;
    uint16 rate = 0;
    for (i = 0; i < bets[_betId].betsCount; i++) {
      if (matches[bets[_betId].bets[i].matchId].result == MatchResult.TEAM_A) rate = matches[bets[_betId].bets[i].matchId].rateA;
      if (matches[bets[_betId].bets[i].matchId].result == MatchResult.TEAM_B) rate = matches[bets[_betId].bets[i].matchId].rateB;
      if (matches[bets[_betId].bets[i].matchId].result == MatchResult.DRAW) rate = matches[bets[_betId].bets[i].matchId].rateDraw;

      prize = prize * rate / 100;     
    }

    //@TODO Check if contract have enough balance for pay prize
    
    bets[_betId].received = true;
    bets[_betId].prize = (prize * (100 - (contractFee + devFee)))/100;
    payable(msg.sender).transfer(bets[_betId].prize);
    payable(owner()).transfer((prize * devFee)/100);
    emit BetPrizeReceived(_betId, bets[_betId].prize);
  }

  function getUserBets(address _address) public view returns(uint[] memory) {
    return ownerToBets[_address];
  }

  function getAllMatches() public view returns(Match[] memory) {
    return matches;
  }

  function getAllCategories() public view returns(Category[] memory) {
    return categories;
  }
}
