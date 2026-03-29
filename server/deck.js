const suits = ["hearts","spades","diamonds","clubs"];

const values = [
"A","2","3","4","5","6","7","8","9","10","J","Q","K"
];

function createDeck(){

  let deck = [];

  suits.forEach(suit => {

    values.forEach(value => {

      deck.push({
        suit,
        value
      });

    });

  });

  return deck;

}

function shuffle(deck){

  for(let i=deck.length-1;i>0;i--){

    const j = Math.floor(Math.random()*(i+1));

    [deck[i],deck[j]]=[deck[j],deck[i]];

  }

  return deck;

}

module.exports = {
  createDeck,
  shuffle
};