function cardPoints(value){

  if(["A","K","Q","J","10"].includes(value))
    return 10;

  return parseInt(value);

}

function calculateScore(cards){

  let total = 0;

  cards.forEach(c=>{
    total += cardPoints(c.value);
  });

  return total;

}

module.exports = { calculateScore };