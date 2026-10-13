/**
 * Day-by-day itineraries supplied by SSM Travel & Tours (lightly cleaned for typos).
 * The Thailand outline was NOT supplied; it is a placeholder to replace.
 */
export interface ItineraryDay { day: string; title: string; detail?: string }
export interface Itinerary { packageId: string; source: 'SSM' | 'placeholder'; note?: string; days: ItineraryDay[] }

export const ITINERARIES: Itinerary[] = [
  {
    packageId: 'IN5', source: 'SSM',
    note: 'Sold as a 5-day trip; the supplied plan describes 4 days (Day 5 not described).',
    days: [
      { day: '1', title: 'Arrival Gaya', detail: 'On arrival at Gaya International Airport / railway station, meet and greet by our representative. Transfer to Bodh Gaya. Rest of the day free for leisure. Overnight at Bodh Gaya.' },
      { day: '2', title: 'Bodh Gaya – full-day sightseeing', detail: 'After breakfast visit Mahabodhi Temple and monasteries built by other Buddhist countries. After lunch, Sujata Village, named after the girl who offered milk to Siddhartha Gautama on his way to Bodh Gaya. Dinner and overnight at Bodh Gaya.' },
      { day: '3', title: 'Bodh Gaya – Rajgir – Nalanda – Bodh Gaya', detail: 'Full-day excursion. Rajgir (approx. 80 km / 3–4 hours), a site of great sanctity for Buddhists: Gridhrakuta Hill, where the Buddha spent many months meditating and preaching; Ajatashatru\'s and Bimbisara\'s jail. After lunch, Nalanda (15 km from Rajgir), one of the oldest universities in the world and an international centre for Buddhist studies. Evening return to Bodh Gaya for dinner and overnight.' },
      { day: '4', title: 'Bodh Gaya – Departure', detail: 'After breakfast the day is free for leisure. In time, transfer to the airport / railway station for the onward journey.' },
    ],
  },
  {
    packageId: 'IN8', source: 'SSM',
    days: [
      { day: '1', title: 'Bodh Gaya' },
      { day: '2', title: 'Bodh Gaya – full day' },
      { day: '3', title: 'Bodh Gaya – Rajgir – Nalanda – Vaishali' },
      { day: '4', title: 'Vaishali – Kushinagar' },
      { day: '5', title: 'Kushinagar – Lumbini' },
      { day: '6', title: 'Lumbini – Kapilavastu – Sravasti' },
      { day: '7', title: 'Sravasti – Sarnath' },
      { day: '8', title: 'Sarnath – Varanasi' },
    ],
  },
  {
    packageId: 'IN12', source: 'SSM',
    note: 'Sold as a 12-day trip; the supplied plan lists 10 days (Days 11–12 not described).',
    days: [
      { day: '1', title: 'Arrival at Kathmandu Airport' },
      { day: '2', title: 'Kathmandu – Boudhanath – Swayambhunath Stupa' },
      { day: '3', title: 'Kathmandu – Lumbini' },
      { day: '4', title: 'Lumbini – Sravasti' },
      { day: '5', title: 'Sravasti – Kushinagar' },
      { day: '6', title: 'Kushinagar – Vaishali – Rajgir' },
      { day: '7', title: 'Rajgir – Bodh Gaya' },
      { day: '8', title: 'Bodh Gaya' },
      { day: '9', title: 'Bodh Gaya – Sarnath' },
      { day: '10', title: 'Sarnath – Varanasi Airport' },
    ],
  },
  {
    packageId: 'IN15', source: 'SSM',
    days: [
      { day: '1', title: 'Delhi – Dharamshala', detail: 'On arrival in Delhi, meet our representative and drive to Dharamshala. Overnight in bus.' },
      { day: '2', title: 'Dharamshala', detail: 'On arrival in Dharamshala, check in to the hotel. Dinner and overnight at the hotel.' },
      { day: '3', title: 'Dharamshala', detail: 'Attend the teaching of His Holiness the Dalai Lama. Dinner and overnight in Dharamshala.' },
      { day: '4', title: 'Dharamshala', detail: 'Attend the teaching of His Holiness the Dalai Lama. Dinner and overnight in Dharamshala.' },
      { day: '5', title: 'Dharamshala – Delhi', detail: 'Attend the teaching of His Holiness the Dalai Lama. After an early dinner, drive to Delhi. Overnight in bus.' },
      { day: '6', title: 'Delhi – Agra (200 km, 4–5 h)', detail: 'Breakfast at a Delhi hotel, then drive to Agra. Visit the Taj Mahal (closed on Fridays) and Agra Fort. Dinner and overnight in Agra.' },
      { day: '7', title: 'Agra – Lucknow (330 km) – Sravasti (180 km)', detail: 'After breakfast drive to Sravasti with lunch en route at Lucknow. Dinner and overnight in Sravasti.' },
      { day: '8', title: 'Sravasti – Lumbini (210 km, 5–6 h)', detail: 'Visit Sravasti, where the Buddha spent 24 monsoons: Jetavana Garden, Ananda Bodhi Tree and Angulimala Stupa. After lunch drive to Lumbini, the birthplace of the Buddha, completing India–Nepal border formalities (a double/multiple-entry India visa is required). Dinner and overnight in Lumbini.' },
      { day: '9', title: 'Lumbini – Kushinagar (175 km, 4 h)', detail: 'Visit the birthplace of the Buddha, Maya Devi Temple and the Ashoka Pillar. Drive to Kushinagar, where the Buddha attained Mahaparinirvana: Mahaparinirvana Temple and Ramabhar Stupa (cremation site). Dinner and overnight in Kushinagar.' },
      { day: '10', title: 'Kushinagar – Vaishali (185 km) – Nalanda – Rajgir (155 km)', detail: 'Drive to Vaishali via Kesariya Stupa; visit Ananda Stupa (Ashoka Pillar) and the Relic Stupa. Continue to Rajgir, visiting the ancient Nalanda University ruins en route. Dinner and overnight in Rajgir.' },
      { day: '11', title: 'Rajgir – Bodh Gaya (85 km, 2 h)', detail: 'Visit Mahabodhi Temple and attend the ceremony. Late afternoon visit the Niranjana River and Sujata Temple across the river. Dinner and overnight in Bodh Gaya.' },
      { day: '12', title: 'Bodh Gaya', detail: 'Mahabodhi Temple ceremony; Niranjana River and Sujata Temple. Dinner and overnight in Bodh Gaya.' },
      { day: '13', title: 'Bodh Gaya', detail: 'Visit the 80-ft Buddha Statue, various monasteries and the Mahabodhi Temple. Dinner and overnight in Bodh Gaya.' },
      { day: '14', title: 'Bodh Gaya – Varanasi (265 km, 6 h)', detail: 'Drive to Varanasi; after lunch visit Sarnath, about 10 km away, where the Buddha delivered his first sermon. Dinner and overnight in Varanasi.' },
      { day: '15', title: 'Varanasi – Delhi – Yangon', detail: 'Early-morning boat ride on the Ganges to see the ghats and temples. After lunch, transfer to the airport for the flight to Delhi, then the night flight to Yangon.' },
    ],
  },
  {
    packageId: 'TH5', source: 'placeholder',
    note: 'Outline only — SSM did not supply a Thailand itinerary. Replace with the real programme.',
    days: [
      { day: '1', title: 'Yangon – Bangkok' },
      { day: '2', title: 'Bangkok city & temples' },
      { day: '3', title: 'Bangkok – Pattaya' },
      { day: '4', title: 'Pattaya' },
      { day: '5', title: 'Pattaya – Bangkok – Yangon' },
    ],
  },
]
