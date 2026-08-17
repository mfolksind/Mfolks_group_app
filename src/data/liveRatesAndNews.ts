export interface LiveRate {
  id: string;
  name: string;
  unit: string;
  price: number;
  change: number; // percentage, e.g. 1.2 or -0.8
  isPositive: boolean;
  category: 'ferrous' | 'non-ferrous' | 'steel' | 'copper' | 'aluminium';
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  date: string;
  readTime: string;
  author: string;
  imageUrl?: string;
}

export const liveRatesData: LiveRate[] = [
  {
    id: 'lr-1',
    name: 'HR Coil (IS 2062)',
    unit: 'Per Metric Ton (MT)',
    price: 54500,
    change: 1.2,
    isPositive: true,
    category: 'steel',
  },
  {
    id: 'lr-2',
    name: 'Mild Steel Rebar 12mm',
    unit: 'Per Metric Ton (MT)',
    price: 48200,
    change: 0.8,
    isPositive: false,
    category: 'steel',
  },
  {
    id: 'lr-3',
    name: 'Stainless Steel 304 Plate',
    unit: 'Per Metric Ton (MT)',
    price: 185000,
    change: 2.4,
    isPositive: true,
    category: 'steel',
  },
  {
    id: 'lr-4',
    name: 'Copper Cathode Grade A',
    unit: 'Per Metric Ton (MT)',
    price: 712000,
    change: 0.5,
    isPositive: true,
    category: 'copper',
  },
  {
    id: 'lr-5',
    name: 'Aluminium Ingot P1020',
    unit: 'Per Metric Ton (MT)',
    price: 245800,
    change: 1.8,
    isPositive: true,
    category: 'aluminium',
  },
  {
    id: 'lr-6',
    name: 'Special High Grade Zinc',
    unit: 'Per Metric Ton (MT)',
    price: 298600,
    change: 0.9,
    isPositive: true,
    category: 'non-ferrous',
  },
  {
    id: 'lr-7',
    name: 'Brass Scrap Honey',
    unit: 'Per Metric Ton (MT)',
    price: 485000,
    change: 1.1,
    isPositive: false,
    category: 'non-ferrous',
  },
  {
    id: 'lr-8',
    name: 'Lead Ingot 99.97%',
    unit: 'Per Metric Ton (MT)',
    price: 192000,
    change: 0.3,
    isPositive: true,
    category: 'non-ferrous',
  },
  {
    id: 'lr-9',
    name: 'CR Coil (IS 513)',
    unit: 'Per Metric Ton (MT)',
    price: 61200,
    change: 1.5,
    isPositive: true,
    category: 'steel',
  },
  {
    id: 'lr-10',
    name: 'Pig Iron Foundry Grade',
    unit: 'Per Metric Ton (MT)',
    price: 41000,
    change: 0.4,
    isPositive: false,
    category: 'ferrous',
  },
];

export const industryNewsData: NewsArticle[] = [
  {
    id: 'news-1',
    title: 'Steel Sector Outlook 2026: Infrastructure Drive Boosts HRC Demand',
    summary: 'Increased government spending on national infrastructure projects expected to boost domestic hot-rolled coil consumption by 12% in FY26.',
    content: `The Indian steel sector is witnessing a robust surge in demand driven by major infrastructure expansion projects nationwide. Industry analysts project a 12% year-on-year growth in hot-rolled coil (HRC) and rebar consumption.

Key drivers include mega highway construction, railway corridor modernization, and urban housing initiatives under PM Awas Yojana. Leading domestic steel manufacturers have responded by optimizing mill capacities and streamlining supply channels for secondary fabricators.

Raw material prices, particularly coking coal imports, have stabilized over the last quarter, providing relief on operational margins for primary steelmakers. Buyers are advised to lock in quarterly contracts as demand trends upward into Q3.`,
    category: 'Steel Market',
    date: '17 Aug 2026',
    readTime: '3 min read',
    author: 'MetalTrade Insights',
  },
  {
    id: 'news-2',
    title: 'Global Copper Prices Surge on Green Energy Supply Deficit',
    summary: 'LME Copper benchmark hits new quarterly high as renewable energy transitions and EV battery manufacturing absorb record cathode volumes.',
    content: `Benchmark copper prices on the London Metal Exchange (LME) breached key resistance levels today as supply constraints coincided with accelerating industrial demand.

Electrification initiatives across solar, wind, and electric vehicle (EV) supply chains are consuming record tonnages of high-grade copper cathodes. Analysts highlight that global mine production growth has lagged behind refining capacity additions.

Fabricators and wire rod manufacturers are increasing inventory reserves ahead of projected autumn supply shortages. Domestic premiums for Grade A copper cathodes are expected to stay firm through the remainder of the calendar year.`,
    category: 'Non-Ferrous',
    date: '16 Aug 2026',
    readTime: '4 min read',
    author: 'Global Metals Bureau',
  },
  {
    id: 'news-3',
    title: 'Aluminium Export Tariffs & Domestic Scrap Guidelines Updated',
    summary: 'Ministry of Steel issues revised guidelines on recycled aluminium ingots and export incentives for secondary smelters.',
    content: `The Ministry of Steel and Customs Authority have announced updated tariff structures governing primary and secondary aluminium products.

The new framework aims to encourage domestic recycling while providing competitive export duty drawbacks for processed aluminium alloys. Secondary smelters specializing in automotive-grade ingots will benefit from streamlined scrap import clearances.

Industry representatives have welcomed the move, noting it will enhance price transparency and boost domestic recycling infrastructure efficiency.`,
    category: 'Policy & Regulations',
    date: '14 Aug 2026',
    readTime: '3 min read',
    author: 'Policy Watch',
  },
  {
    id: 'news-4',
    title: 'Automotive Sector Growth Fuels High-Strength Alloy Demand',
    summary: 'Passenger vehicle and commercial transport production milestones drive high demand for specialized alloy steels and precision tubes.',
    content: `Record production figures across the domestic automotive sector are creating unprecedented demand for high-strength low-alloy (HSLA) steels and seamless precision tubing.

Vehicle manufacturers are increasingly adopting lightweight alloy grades to comply with stringent safety and emission standards. Secondary component manufacturers report full order books for the upcoming festive quarter.

Specialized alloy stockists have expanded inventory listings to meet custom length and tolerance requirements for Tier 1 suppliers.`,
    category: 'Automotive & Alloys',
    date: '12 Aug 2026',
    readTime: '5 min read',
    author: 'AutoMet Weekly',
  },
];
