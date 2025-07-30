export interface Customer {
  id: number
  name: string
  email: string
  phone: string
  totalOrders: number
  totalSpent: number
  lastVisit: string
  loyaltyPoints: number
  status: 'active' | 'inactive' | 'vip'
  avatar?: string
  orderHistory?: Array<{
    id: number
    date: string
    total: number
    items: string[]
    status: 'completed' | 'pending' | 'cancelled'
  }>
}

export const sampleCustomers: Customer[] = [
  {
    id: 1,
    name: 'Jordan Martinez',
    email: 'jordan.martinez@email.com',
    phone: '(704) 555-0123',
    totalOrders: 24,
    totalSpent: 1250.00,
    lastVisit: '2024-01-15',
    loyaltyPoints: 485,
    status: 'vip',
    orderHistory: [
      { id: 1001, date: '2024-01-15', total: 85.50, items: ['Blue Dream 3.5g', 'Gummies 10mg'], status: 'completed' },
      { id: 1002, date: '2024-01-12', total: 120.00, items: ['OG Kush 7g', 'Vape Cart'], status: 'completed' },
      { id: 1003, date: '2024-01-08', total: 65.25, items: ['Edibles Mixed Pack'], status: 'completed' }
    ]
  },
  {
    id: 2,
    name: 'Alex Thompson',
    email: 'alex.thompson@email.com',
    phone: '(704) 555-0124',
    totalOrders: 12,
    totalSpent: 675.50,
    lastVisit: '2024-01-14',
    loyaltyPoints: 210,
    status: 'active',
    orderHistory: [
      { id: 2001, date: '2024-01-14', total: 95.00, items: ['Sour Diesel 3.5g', 'Pre-rolls x3'], status: 'completed' },
      { id: 2002, date: '2024-01-10', total: 140.25, items: ['Concentrate 1g', 'Edibles'], status: 'completed' }
    ]
  },
  {
    id: 3,
    name: 'Sam Rodriguez',
    email: 'sam.rodriguez@email.com',
    phone: '(704) 555-0125',
    totalOrders: 8,
    totalSpent: 425.00,
    lastVisit: '2024-01-12',
    loyaltyPoints: 125,
    status: 'active'
  },
  {
    id: 4,
    name: 'Casey Johnson',
    email: 'casey.johnson@email.com',
    phone: '(704) 555-0126',
    totalOrders: 35,
    totalSpent: 2100.75,
    lastVisit: '2024-01-16',
    loyaltyPoints: 750,
    status: 'vip'
  },
  {
    id: 5,
    name: 'Taylor Davis',
    email: 'taylor.davis@email.com',
    phone: '(704) 555-0127',
    totalOrders: 6,
    totalSpent: 320.25,
    lastVisit: '2024-01-10',
    loyaltyPoints: 85,
    status: 'active'
  },
  {
    id: 6,
    name: 'Morgan Wilson',
    email: 'morgan.wilson@email.com',
    phone: '(704) 555-0128',
    totalOrders: 2,
    totalSpent: 125.00,
    lastVisit: '2024-01-08',
    loyaltyPoints: 25,
    status: 'inactive'
  },
  {
    id: 7,
    name: 'Riley Parker',
    email: 'riley.parker@email.com',
    phone: '(704) 555-0129',
    totalOrders: 18,
    totalSpent: 890.50,
    lastVisit: '2024-01-17',
    loyaltyPoints: 325,
    status: 'active'
  },
  {
    id: 8,
    name: 'Avery Chen',
    email: 'avery.chen@email.com',
    phone: '(704) 555-0130',
    totalOrders: 45,
    totalSpent: 3200.00,
    lastVisit: '2024-01-18',
    loyaltyPoints: 980,
    status: 'vip'
  },
  {
    id: 9,
    name: 'Quinn Foster',
    email: 'quinn.foster@email.com',
    phone: '(704) 555-0131',
    totalOrders: 9,
    totalSpent: 475.25,
    lastVisit: '2024-01-11',
    loyaltyPoints: 145,
    status: 'active'
  },
  {
    id: 10,
    name: 'Blake Turner',
    email: 'blake.turner@email.com',
    phone: '(704) 555-0132',
    totalOrders: 28,
    totalSpent: 1650.75,
    lastVisit: '2024-01-16',
    loyaltyPoints: 620,
    status: 'vip'
  },
  {
    id: 11,
    name: 'Sage Mitchell',
    email: 'sage.mitchell@email.com',
    phone: '(704) 555-0133',
    totalOrders: 3,
    totalSpent: 180.00,
    lastVisit: '2024-01-05',
    loyaltyPoints: 45,
    status: 'inactive'
  },
  {
    id: 12,
    name: 'River Brooks',
    email: 'river.brooks@email.com',
    phone: '(704) 555-0134',
    totalOrders: 15,
    totalSpent: 825.50,
    lastVisit: '2024-01-15',
    loyaltyPoints: 285,
    status: 'active'
  },
  {
    id: 13,
    name: 'Phoenix Gray',
    email: 'phoenix.gray@email.com',
    phone: '(704) 555-0135',
    totalOrders: 22,
    totalSpent: 1150.25,
    lastVisit: '2024-01-17',
    loyaltyPoints: 425,
    status: 'active'
  },
  {
    id: 14,
    name: 'Skyler Reed',
    email: 'skyler.reed@email.com',
    phone: '(704) 555-0136',
    totalOrders: 38,
    totalSpent: 2450.00,
    lastVisit: '2024-01-18',
    loyaltyPoints: 850,
    status: 'vip'
  },
  {
    id: 15,
    name: 'Cameron Bell',
    email: 'cameron.bell@email.com',
    phone: '(704) 555-0137',
    totalOrders: 7,
    totalSpent: 385.75,
    lastVisit: '2024-01-09',
    loyaltyPoints: 95,
    status: 'active'
  },
  {
    id: 16,
    name: 'Rowan Stone',
    email: 'rowan.stone@email.com',
    phone: '(704) 555-0138',
    totalOrders: 1,
    totalSpent: 65.00,
    lastVisit: '2024-01-03',
    loyaltyPoints: 15,
    status: 'inactive'
  },
  {
    id: 17,
    name: 'Emery Walsh',
    email: 'emery.walsh@email.com',
    phone: '(704) 555-0139',
    totalOrders: 31,
    totalSpent: 1875.50,
    lastVisit: '2024-01-16',
    loyaltyPoints: 695,
    status: 'vip'
  },
  {
    id: 18,
    name: 'Finley Cooper',
    email: 'finley.cooper@email.com',
    phone: '(704) 555-0140',
    totalOrders: 14,
    totalSpent: 720.25,
    lastVisit: '2024-01-13',
    loyaltyPoints: 235,
    status: 'active'
  },
  {
    id: 19,
    name: 'Hayden Price',
    email: 'hayden.price@email.com',
    phone: '(704) 555-0141',
    totalOrders: 26,
    totalSpent: 1425.75,
    lastVisit: '2024-01-17',
    loyaltyPoints: 515,
    status: 'active'
  },
  {
    id: 20,
    name: 'Marlowe Kim',
    email: 'marlowe.kim@email.com',
    phone: '(704) 555-0142',
    totalOrders: 4,
    totalSpent: 225.00,
    lastVisit: '2024-01-06',
    loyaltyPoints: 55,
    status: 'inactive'
  },
  {
    id: 21,
    name: 'Indigo Hayes',
    email: 'indigo.hayes@email.com',
    phone: '(704) 555-0143',
    totalOrders: 19,
    totalSpent: 975.50,
    lastVisit: '2024-01-15',
    loyaltyPoints: 365,
    status: 'active'
  },
  {
    id: 22,
    name: 'Cypress Morgan',
    email: 'cypress.morgan@email.com',
    phone: '(704) 555-0144',
    totalOrders: 42,
    totalSpent: 2850.25,
    lastVisit: '2024-01-18',
    loyaltyPoints: 925,
    status: 'vip'
  },
  {
    id: 23,
    name: 'Wren Fisher',
    email: 'wren.fisher@email.com',
    phone: '(704) 555-0145',
    totalOrders: 11,
    totalSpent: 585.75,
    lastVisit: '2024-01-12',
    loyaltyPoints: 175,
    status: 'active'
  },
  {
    id: 24,
    name: 'Aspen Cole',
    email: 'aspen.cole@email.com',
    phone: '(704) 555-0146',
    totalOrders: 33,
    totalSpent: 2125.00,
    lastVisit: '2024-01-17',
    loyaltyPoints: 775,
    status: 'vip'
  },
  {
    id: 25,
    name: 'Sage Rivera',
    email: 'sage.rivera@email.com',
    phone: '(704) 555-0147',
    totalOrders: 8,
    totalSpent: 440.25,
    lastVisit: '2024-01-10',
    loyaltyPoints: 115,
    status: 'active'
  },
  {
    id: 26,
    name: 'Juniper Ward',
    email: 'juniper.ward@email.com',
    phone: '(704) 555-0148',
    totalOrders: 2,
    totalSpent: 135.50,
    lastVisit: '2024-01-04',
    loyaltyPoints: 25,
    status: 'inactive'
  },
  {
    id: 27,
    name: 'Oakley Ross',
    email: 'oakley.ross@email.com',
    phone: '(704) 555-0149',
    totalOrders: 29,
    totalSpent: 1725.75,
    lastVisit: '2024-01-16',
    loyaltyPoints: 645,
    status: 'vip'
  },
  {
    id: 28,
    name: 'Briar James',
    email: 'briar.james@email.com',
    phone: '(704) 555-0150',
    totalOrders: 16,
    totalSpent: 825.00,
    lastVisit: '2024-01-14',
    loyaltyPoints: 295,
    status: 'active'
  },
  {
    id: 29,
    name: 'Sage Bennett',
    email: 'sage.bennett@email.com',
    phone: '(704) 555-0151',
    totalOrders: 21,
    totalSpent: 1095.50,
    lastVisit: '2024-01-15',
    loyaltyPoints: 395,
    status: 'active'
  },
  {
    id: 30,
    name: 'Cedar Phillips',
    email: 'cedar.phillips@email.com',
    phone: '(704) 555-0152',
    totalOrders: 5,
    totalSpent: 285.25,
    lastVisit: '2024-01-07',
    loyaltyPoints: 65,
    status: 'inactive'
  },
  {
    id: 31,
    name: 'Willow Cruz',
    email: 'willow.cruz@email.com',
    phone: '(704) 555-0153',
    totalOrders: 37,
    totalSpent: 2350.00,
    lastVisit: '2024-01-17',
    loyaltyPoints: 825,
    status: 'vip'
  },
  {
    id: 32,
    name: 'Ash Powell',
    email: 'ash.powell@email.com',
    phone: '(704) 555-0154',
    totalOrders: 13,
    totalSpent: 675.75,
    lastVisit: '2024-01-13',
    loyaltyPoints: 215,
    status: 'active'
  },
  {
    id: 33,
    name: 'Fern Watson',
    email: 'fern.watson@email.com',
    phone: '(704) 555-0155',
    totalOrders: 25,
    totalSpent: 1385.50,
    lastVisit: '2024-01-16',
    loyaltyPoints: 485,
    status: 'active'
  },
  {
    id: 34,
    name: 'Moss Kelly',
    email: 'moss.kelly@email.com',
    phone: '(704) 555-0156',
    totalOrders: 3,
    totalSpent: 165.00,
    lastVisit: '2024-01-05',
    loyaltyPoints: 35,
    status: 'inactive'
  },
  {
    id: 35,
    name: 'Iris Santos',
    email: 'iris.santos@email.com',
    phone: '(704) 555-0157',
    totalOrders: 40,
    totalSpent: 2675.25,
    lastVisit: '2024-01-18',
    loyaltyPoints: 895,
    status: 'vip'
  },
  {
    id: 36,
    name: 'Clover Hughes',
    email: 'clover.hughes@email.com',
    phone: '(704) 555-0158',
    totalOrders: 17,
    totalSpent: 895.50,
    lastVisit: '2024-01-14',
    loyaltyPoints: 315,
    status: 'active'
  },
  {
    id: 37,
    name: 'Basil Torres',
    email: 'basil.torres@email.com',
    phone: '(704) 555-0159',
    totalOrders: 23,
    totalSpent: 1245.75,
    lastVisit: '2024-01-15',
    loyaltyPoints: 445,
    status: 'active'
  },
  {
    id: 38,
    name: 'Sage Flores',
    email: 'sage.flores@email.com',
    phone: '(704) 555-0160',
    totalOrders: 6,
    totalSpent: 325.00,
    lastVisit: '2024-01-08',
    loyaltyPoints: 75,
    status: 'inactive'
  },
  {
    id: 39,
    name: 'Thyme Rivera',
    email: 'thyme.rivera@email.com',
    phone: '(704) 555-0161',
    totalOrders: 34,
    totalSpent: 2185.50,
    lastVisit: '2024-01-17',
    loyaltyPoints: 795,
    status: 'vip'
  },
  {
    id: 40,
    name: 'Mint Adams',
    email: 'mint.adams@email.com',
    phone: '(704) 555-0162',
    totalOrders: 12,
    totalSpent: 635.25,
    lastVisit: '2024-01-12',
    loyaltyPoints: 195,
    status: 'active'
  }
] 