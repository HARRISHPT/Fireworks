const roundMoney = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return null
  }

  return Number(Number(value).toFixed(2))
}

const derivePricing = (originalPrice) => {
  if (originalPrice === null || originalPrice === undefined) {
    return {
      originalPrice: null,
      discountPercentage: null,
      discountAmount: null,
      discountedPrice: null,
      finalPrice: null,
      priceStatus: 'Price on Request',
    }
  }

  const original = Number(originalPrice)
  const discountPercentage = 90
  const discountAmount = roundMoney(original * (discountPercentage / 100))
  const discountedPrice = roundMoney(original - discountAmount)
  const finalPrice = discountedPrice

  return {
    originalPrice: original,
    discountPercentage,
    discountAmount,
    discountedPrice,
    finalPrice,
    priceStatus: 'Available',
  }
}

const makeProduct = (serialNumber, productName, category, packaging, originalPrice) => ({
  serialNumber,
  productName,
  category,
  packaging,
  ...derivePricing(originalPrice),
})

export const categoryColors = {
  'Flower Pots': '#d97706',
  'Ground Chakkar': '#0f766e',
  'One Sound / 2 Sound Crackers': '#f97316',
  'Loose Crackers': '#dc2626',
  Bombs: '#4b5563',
  'Twinkling Star': '#7c3aed',
  'Fancy Fountain': '#0ea5a4',
  'Fancy Multicolor Shot / Continue Shots': '#2563eb',
  'Fancy Single Shots': '#c026d3',
  Sparklers: '#d4a017',
  Rocket: '#4338ca',
}

export const categoryOrder = [
  'Flower Pots',
  'Ground Chakkar',
  'One Sound / 2 Sound Crackers',
  'Loose Crackers',
  'Bombs',
  'Twinkling Star',
  'Fancy Fountain',
  'Fancy Multicolor Shot / Continue Shots',
  'Fancy Single Shots',
  'Sparklers',
  'Rocket',
]

export const products = [
  makeProduct(1, 'FLOWERPOT SMALL', 'Flower Pots', '1 BOX', 500),
  makeProduct(2, 'FLOWERPOT BIG', 'Flower Pots', '1 BOX', 600),
  makeProduct(3, 'FLOWERPOT SPECIAL', 'Flower Pots', '1 BOX', 800),
  makeProduct(4, 'FLOWERPOT ASHOKA', 'Flower Pots', '1 BOX', 800),
  makeProduct(5, 'COLOR KOTI (10PCS)', 'Flower Pots', '1 BOX', 1800),
  makeProduct(6, 'COLORKOTI DELUX 10 PCS', 'Flower Pots', '1 BOX', 3000),
  makeProduct(7, 'FLOWERPOT DELUX (5 PCS)', 'Flower Pots', '1 BOX', 1500),
  makeProduct(8, 'TRICOLOR', 'Flower Pots', '1 BOX', 2500),
  makeProduct(9, 'COLOUR KOTI MEGA DELUXE (10 PCS)', 'Flower Pots', '1 BOX', 4500),
  makeProduct(11, 'GROUND CHAKKAR BIG (10 PCS)', 'Ground Chakkar', '1 BOX', 450),
  makeProduct(12, 'GROUND CHAKKAR SPECIAL (10 PCS)', 'Ground Chakkar', '1 BOX', 700),
  makeProduct(13, 'GROUND CHAKKAR DELUX (10 PCS)', 'Ground Chakkar', '1 BOX', 1800),
  makeProduct(14, 'GROUND CHAKKAR ASHOKA WITH PLASTIC', 'Ground Chakkar', '1 BOX', 1300),
  makeProduct(15, 'GROUND CHAKKAR SPINNER SPECIAL', 'Ground Chakkar', '1 BOX', 1300),
  makeProduct(16, 'GROUND CHAKKAR SPINNER DELUXE', 'Ground Chakkar', '1 BOX', 1800),
  makeProduct(17, '2.75 KURUVI', 'One Sound / 2 Sound Crackers', '1 PKT', 85),
  makeProduct(18, '3.5 LAKSHMI/BIRD/CHOTTA', 'One Sound / 2 Sound Crackers', '1 PKT', 130),
  makeProduct(19, '4 LAKSHMI/CHOTTA/HULK', 'One Sound / 2 Sound Crackers', '1 PKT', 200),
  makeProduct(20, '4 DELUXE LAKSHMI/HULK/SPIDER', 'One Sound / 2 Sound Crackers', '1 PKT', 250),
  makeProduct(21, '5 DELUX HULK/SPIDER/KUMKI', 'One Sound / 2 Sound Crackers', '1 PKT', 450),
  makeProduct(22, '6 DELUX HULK/SPIDER/TIGER', 'One Sound / 2 Sound Crackers', '1 PKT', null),
  makeProduct(23, 'GOLD LAKSHMI/CHOTTA', 'One Sound / 2 Sound Crackers', '1 PKT', 300),
  makeProduct(24, 'JALLIKATTU CRACKERS (20 PAPERS)', 'One Sound / 2 Sound Crackers', '1 PKT', 450),
  makeProduct(25, 'BEST RIDER (5PCS)', 'One Sound / 2 Sound Crackers', '1 PKT', 1100),
  makeProduct(26, 'RED BIJILI (50 PCS)', 'Loose Crackers', '1 PKT', 250),
  makeProduct(27, 'RED BIJILI (100 PCS)', 'Loose Crackers', '1 PKT', 500),
  makeProduct(28, 'BIG BULLET', 'Bombs', '1 BOX', 350),
  makeProduct(29, 'MEGA BULLET', 'Bombs', '1 BOX', 600),
  makeProduct(30, 'HYDRO BOMB', 'Bombs', '1 BOX', 900),
  makeProduct(31, 'CLASSIC BOMB', 'Bombs', '1 BOX', 1500),
  makeProduct(32, 'AGNI BOMB', 'Bombs', '1 BOX', 2000),
  makeProduct(33, 'DIGITAL BOMB', 'Bombs', '1 BOX', 2500),
  makeProduct(34, 'PAPER BOMB ¼ KG', 'Bombs', '1 BOX', 400),
  makeProduct(35, 'PAPER BOMB ½ KG', 'Bombs', '1 BOX', 800),
  makeProduct(36, 'PAPER BOMB 1 KG', 'Bombs', '1 BOX', 1600),
  makeProduct(37, '1.5 TWINKLING STAR', 'Twinkling Star', '1 BOX', 250),
  makeProduct(38, '4 TWINKLING STAR', 'Twinkling Star', '1 BOX', 600),
  makeProduct(39, 'BEN 10 (CHITTU PUTTU)', 'Fancy Fountain', '1 BOX', 400),
  makeProduct(40, 'PHOTO FLASH', 'Fancy Fountain', '1 BOX', 350),
  makeProduct(41, 'SELFIE STICK', 'Fancy Fountain', '1 BOX', 350),
  makeProduct(42, 'PEACOCK FEATHER DROP', 'Fancy Fountain', '1 BOX', 900),
  makeProduct(43, 'GOLDEN DROPS', 'Fancy Fountain', '1 BOX', 900),
  makeProduct(44, 'BUTTER FLY', 'Fancy Fountain', '1 BOX', 800),
  makeProduct(45, 'HELICOPTER', 'Fancy Fountain', '1 BOX', 800),
  makeProduct(46, 'SPINNER', 'Fancy Fountain', '1 BOX', 1000),
  makeProduct(47, 'ELECTRIC STONE', 'Fancy Fountain', '1 BOX', 60),
  makeProduct(48, 'ZEE BOOMBA', 'Fancy Fountain', '1 BOX', 60),
  makeProduct(49, 'MAGIC POP', 'Fancy Fountain', '1 BOX', 60),
  makeProduct(50, 'ASSORTED CARTOON 5 PCS', 'Fancy Fountain', '1 BOX', 150),
  makeProduct(51, 'KJ POT FOUNTAIN (5 PCS)', 'Fancy Fountain', '1 BOX', 3200),
  makeProduct(52, 'KING STAR (3 PCS)', 'Fancy Fountain', '1 BOX', 3600),
  makeProduct(53, 'TEDDY SHOWER', 'Fancy Fountain', '1 BOX', 2800),
  makeProduct(54, 'WIFI SHOWER (5 PCS)', 'Fancy Fountain', '1 BOX', 1800),
  makeProduct(55, 'MINI SIREN (5 PCS)', 'Fancy Fountain', '1 BOX', 1900),
  makeProduct(56, 'BIG SIREN (3 PCS)', 'Fancy Fountain', '1 BOX', 1900),
  makeProduct(57, 'COLOR SMOKE', 'Fancy Fountain', '1 BOX', null),
  makeProduct(58, 'BAT AND BALL', 'Fancy Fountain', '1 BOX', 2500),
  makeProduct(59, 'MONEY BANK', 'Fancy Fountain', '1 BOX', 2500),
  makeProduct(60, 'COCK FIGHT (2 PCS)', 'Fancy Fountain', '1 BOX', 2000),
  makeProduct(61, 'MEDIUM PEACOCK', 'Fancy Fountain', '1 BOX', 1800),
  makeProduct(62, 'BADA PEACOCK', 'Fancy Fountain', '1 BOX', 4000),
  makeProduct(63, 'LEMON TREE DOUBLE FUNCTION', 'Fancy Fountain', '1 BOX', 2500),
  makeProduct(64, '7 SHOT (5 PCS)', 'Fancy Multicolor Shot / Continue Shots', '1 BOX', 1000),
  makeProduct(65, '12 SHOT', 'Fancy Multicolor Shot / Continue Shots', '1 BOX', 1400),
  makeProduct(66, '25 SHOT', 'Fancy Multicolor Shot / Continue Shots', '1 BOX', 2800),
  makeProduct(67, '30 SHOT', 'Fancy Multicolor Shot / Continue Shots', '1 BOX', 3800),
  makeProduct(68, '60 SHOT', 'Fancy Multicolor Shot / Continue Shots', '1 BOX', 7600),
  makeProduct(69, '120 SHOT', 'Fancy Multicolor Shot / Continue Shots', '1 BOX', 15200),
  makeProduct(70, '240 SHOT', 'Fancy Multicolor Shot / Continue Shots', '1 BOX', 30400),
  makeProduct(71, 'SKY SHOT (5 PCS)', 'Fancy Single Shots', '1 BOX', 800),
  makeProduct(72, 'CHOTTA FANCY', 'Fancy Single Shots', '1 BOX', 600),
  makeProduct(73, 'PAINT THE SKY (3 PCS)', 'Fancy Single Shots', '1 BOX', 1800),
  makeProduct(74, '2’ INCH PIPE', 'Fancy Single Shots', '1 BOX', 800),
  makeProduct(75, '1.75’ INCH PIPE (3 PCS)', 'Fancy Single Shots', '1 BOX', 2300),
  makeProduct(76, '3.5’ INCH PIPE', 'Fancy Single Shots', '1 BOX', 2800),
  makeProduct(77, '4’ INCH PIPE', 'Fancy Single Shots', '1 BOX', 4000),
  makeProduct(78, '4’ INCH DOUBLE BALL', 'Fancy Single Shots', '1 BOX', 4700),
  makeProduct(79, '7 CM ELECTRIC SPARKLERS', 'Sparklers', '10 BOX', 800),
  makeProduct(80, '7 CM COLOR SPARKLERS', 'Sparklers', '10 BOX', 950),
  makeProduct(81, '7 CM GREEN SPARKLERS', 'Sparklers', '10 BOX', 1100),
  makeProduct(82, '7 CM RED SPARKLERS', 'Sparklers', '10 BOX', 1300),
  makeProduct(83, '10 CM ELECTRIC SPARKLERS', 'Sparklers', '10 BOX', 1500),
  makeProduct(84, '10 CM COLOR SPARKLERS', 'Sparklers', '10 BOX', 1700),
  makeProduct(85, '10 CM GREEN SPARKLERS', 'Sparklers', '10 BOX', 1900),
  makeProduct(86, '10 CM RED SPARKLERS', 'Sparklers', '10 BOX', 2000),
  makeProduct(87, '15 CM ELECTRIC SPARKLERS', 'Sparklers', '1 BOX', 500),
  makeProduct(88, '15 CM COLOR SPARKLERS', 'Sparklers', '1 BOX', 650),
  makeProduct(89, '15 CM GREEN SPARKLERS', 'Sparklers', '1 BOX', 650),
  makeProduct(90, '15 CM RED SPARKLERS', 'Sparklers', '1 BOX', 750),
  makeProduct(91, '30 CM ELECTRIC SPARKLERS', 'Sparklers', '1 BOX', 400),
  makeProduct(92, '30 CM COLOR SPARKLERS', 'Sparklers', '1 BOX', 550),
  makeProduct(93, '30 CM GREEN SPARKLERS', 'Sparklers', '1 BOX', 650),
  makeProduct(94, '30 CM RED SPARKLERS', 'Sparklers', '1 BOX', 750),
  makeProduct(95, '50 CM ELECTRIC SPARKLERS', 'Sparklers', '1 BOX', 1500),
  makeProduct(96, '50 CM COLOR SPARKLERS', 'Sparklers', '1 BOX', 1700),
  makeProduct(97, 'ROCKET BOMB', 'Rocket', '1 BOX', 600),
  makeProduct(98, 'LUNIK ROCKET', 'Rocket', '1 BOX', 1200),
  makeProduct(99, '2 SOUND ROCKET', 'Rocket', '1 BOX', 1400),
  makeProduct(100, '3 SOUND ROCKET', 'Rocket', '1 BOX', 1600),
  makeProduct(101, 'WHITLING ROCKET', 'Rocket', '1 BOX', 2300),
]

export const getProductCategoryCount = (category) =>
  products.filter((product) => product.category === category).length
