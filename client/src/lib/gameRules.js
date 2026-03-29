const suitOrder = {
  hearts: 0,
  spades: 1,
  diamonds: 2,
  clubs: 3
};

const playOrder = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

export function valueToNumber(value) {
  return playOrder.indexOf(String(value));
}

export function sortCards(cards = []) {
  return [...cards].sort((left, right) => {
    const suitDelta = (suitOrder[left.suit] ?? 99) - (suitOrder[right.suit] ?? 99);
    if (suitDelta !== 0) return suitDelta;
    return valueToNumber(left.value) - valueToNumber(right.value);
  });
}

export function getValidMoves(board, cards = []) {
  const boardState = board || {
    hearts: [],
    spades: [],
    diamonds: [],
    clubs: []
  };

  const isFirstMove = Object.values(boardState).every((pile) => pile.length === 0);

  return cards.filter((card) => {
    const suitBoard = boardState[card.suit];
    if (!suitBoard) return false;

    if (isFirstMove) {
      return card.suit === "hearts" && card.value === "7";
    }

    if (suitBoard.length === 0) {
      return card.value === "7" && boardState.hearts.length > 0;
    }

    const numbers = suitBoard.map(valueToNumber).sort((a, b) => a - b);
    const cardNumber = valueToNumber(card.value);
    const min = numbers[0];
    const max = numbers[numbers.length - 1];

    return cardNumber === min - 1 || cardNumber === max + 1;
  });
}

export function getSuitCounts(cards = []) {
  return cards.reduce((counts, card) => {
    counts[card.suit] = (counts[card.suit] || 0) + 1;
    return counts;
  }, {
    hearts: 0,
    spades: 0,
    diamonds: 0,
    clubs: 0
  });
}
