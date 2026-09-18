// environments-day.js

// Key = internal identifier you use in your UI / logic.
// value.label = human-readable label the model should see.
// value.description = short, concrete description you want in the context.
export const DAY_ENVIRONMENTS = {
    public_library: {
        label: 'a public library',
        description: `Public libraries are common spaces for unhoused people to spend time because they are safe, free to use, and provide access to books, computers, internet, and information about resources. Libraries also offer shelter from heat in the summer and cold in the winter, and some staff quietly recognize regular patrons who are experiencing homelessness and may direct them toward help or public programs.`,
        resourcesPerCity: {
            atlanta: [
                { name: 'Central Library' }
            ],
            boston: [
                { name: 'Boston Public Library' }
            ],
            dc: [
                { name: 'Martin Luther King, Jr. Memorial Library' },
                { name: 'West End Neighborhood Library' },
                { name: 'Northwest One Neighborhood Library' }
            ],
            LA: [
                { name: 'Central Library' },
                { name: 'Little Tokyo Branch of the LA Public Library' },
                { name: 'Abbot Kinney Branch of the LA Public Library in Venice' },
                { name: 'Santa Monica Public Library' },
                { name: 'Westwood Branch of the LA Public Library' }
            ],
            NYC: [
                { name: 'New York Public Library' },
                { name: 'Brooklyn Public Library' },
                { name: 'Queens Public Library' }
            ],
            portland: [
                { name: 'The Central Library' },
                { name: 'Northwest Library' },
            ]
        }
    },
    outdoor_encampment: {
        label: 'an outdoor encampment',
        description: `Outdoor encampments are clusters of tents or makeshift shelters where unhoused people live close together. People may choose them because they can look out for one another, share food and supplies, and feel safer than sleeping completely alone. However, encampments are often subject to sweeps, complaints, and sudden displacement.`,
        resourcesPerCity: {
            atlanta: [
                { name: 'The Hill' },
                { name: 'Peachtree Creek' },
                { name: 'Buford Highway' },
                { name: 'Cheshire Bridge' }
            ],
            boston: [
                { name: 'Davis Square' },
                { name: 'Harvard Square' },
                { name: 'Copley Square' },
                { name: 'Longfellow Bridge' },
                { name: 'BU Bridge' },
                { name: 'Downtown Crossing' },
                { name: 'North Station' }
            ],
            dc: [
                { name: 'Washington Circle' },
                { name: 'C&O Canal' },
                { name: 'Rock Creek Park' },
                { name: 'Martin Luther King Jr. Memorial Library' },
                { name: '15th and G Street' },
                { name: 'Kennedy Center' },
                { name: 'Burke Park' },
                { name: 'Gompers Park' },
                { name: 'Foggy Bottom' },
                { name: 'San Martin Memorial Park' },
                { name: 'Union Station' },
                { name: 'Dupont Circle' }
            ],
            LA: [
                { name: 'Skid Row' },
                { name: 'Echo Park Lake' },
                { name: 'Wilton Place' },
                { name: 'Venice Beach' },
                { name: 'Wilshire Boulevard' },
                { name: '10 freeway underpasses' },
                { name: '101 freeway underpasses' },
                { name: 'Avalon Boulevard' }
            ],
            NYC: [
                { name: '' },
            ],
            portland: [
                { name: 'Laurelhurst Park' },
                { name: 'Central Eastside Industrial District' },
                { name: 'Springwater Corridor' }
            ]
        }
    },
    food_pantry: {
        label: 'a food pantry',
        description: `Food pantries provide groceries or prepared meals at little or no cost. For many unhoused people, visiting a pantry is a regular part of surviving each week. Some pantries allow people to stay and sit for a while, while others involve long lines outside, waiting to be called in for food.`
    },
    churches_faith_spaces: {
        label: 'churches and faith spaces',
        description: `Many churches and faith spaces host community programming that unhoused folks may like to participate in, many regardless of guests' religious affiliation, these spaces may also host programming, recreation spaces, events, and day centers for people experiencing homelessness to come spend their time.`
    },
    green_spaces: {
        label: 'a green space',
        description: `Green spaces such as parks and esplanades provide a reprive for many unhoused folks-- these spaces are frequented by people experiencing homelessness because they often offer shade, pleasant places to sit and spend time, access to nature, and may be generally safer than other spaces.`
    },
    day_shelters: {
        label: 'a day shelter',
        description: `Day shelters do not exist in every city (particularly smaller, rural areas), and some unhoused folks may choose to avoid day shelters due to distrust of staff or other guests, but day shelters are a popular option for unhoused folks to spend their time during the day where they often have access to things like bathrooms, comfortable seating, internet and computers, food, hygiene products, and supportive services.`,
        resourcesPerCity: {
            atlanta: [
                {
                    name: `Atlanta Children's Day Center`,
                    eligibility: [
                        { age: 'under 18' }
                    ]
                },
                { name: 'The Gateway Center Engagement Center' },
                {
                    name: 'Covenent House Georgia, supportive services for youth',
                    eligibility: [
                        { age: 'under 18' }
                    ]
                },
                {
                    name: 'Lost-n-Found Youth Drop-In Center',
                    eligibility: [
                        {
                            age: 'under 18',
                            gender: ['transgender', 'non-binary', 'other'],
                            sexuality: ['asexual', 'bisexual', 'gay', 'lesbian', 'queer', 'pansexual', 'other']
                        }
                    ]
                },
                {
                    name: `CHRIS 180’s Drop-in Center, also known as The SPOT (Supporting People Overcoming Trouble)`,
                    eligibility: [
                        { age: ['under 18', '18-24'] }
                    ]
                }
            ],
            boston: [
                { name: 'St Francis House, Day Shelter' },
                { name: 'The Boston Living Center' },
                {
                    name: 'Women’s Lunch Place',
                    eligibility: [{
                        presentation: ['feminine', 'androgynous']
                    }]
                },
                {
                    name: 'The Cardinal Medeiros Center',
                    eligibility: [
                        {
                            age: ['18-24', '25 - 34', '35 - 44', '45 - 54', '55 - 64', '65 +']
                        }
                    ]
                },
                {
                    name: 'Boston GLASS Community Center',
                    eligibility: [
                        {
                            age: 'under 18',
                            gender: ['transgender', 'non-binary', 'other'],
                            sexuality: ['asexual', 'bisexual', 'gay', 'lesbian', 'queer', 'pansexual', 'other']
                        }
                    ]
                },
                {
                    name: 'Bridge Over Troubled Waters Day Shelter',
                    eligibility: [
                        { age: ['under 18', '18-24'] }
                    ]
                }
            ],
            dc: [
                { name: 'Downtown Day Services Center' },
                { name: 'Adams Place Day Center  ' },
                { name: '801 East Day Center ' },
                {
                    name: `Zoe's Doors Drop-In Center`,
                    eligibility: [
                        { age: ['under 18', '18-24'] }
                    ]
                },
                {
                    name: `Shirley's Place, Everyone Home DC's drop-in day center`
                }
            ],
            LA: [
                { name: 'Dream Center' },
                { name: 'The Refresh Spot' },
                { name: `St. Joseph’s Center` },
                { name: 'Watts Labor Community Action Committeee Homeless Access Center' },
                { name: 'The Center' },
                { name: 'St Francis Center' },
                { name: 'The People Concern' },
                {
                    name: 'Los Angeles LGBT Center',
                    eligibility: [
                        {
                            gender: ['transgender', 'non-binary', 'other'],
                            sexuality: ['asexual', 'bisexual', 'gay', 'lesbian', 'queer', 'pansexual', 'other']
                        }
                    ]
                },
                {
                    name: 'Covenant House California, supportive services for youth',
                    eligibility: [
                        { age: ['under 18', '18-24'] }
                    ]
                },
                {
                    name: 'Downtown Women’s Center Day Center',
                    eligibility: [
                        { presentation: ['feminine', 'androgynous'] }
                    ]
                }
            ],
            NYC: [
                { name: 'Mainchance Drop-In Center' },
                { name: 'Olivieri Center for Homeless' },
                { name: `Paul's Place Drop-In Center` },
                { name: '9th Avenue Drop-In Center' },
                { name: 'The Living Room Drop-In Center, The Bronx' },
                { name: 'The Gathering Place Drop-In Center, Brooklyn' },
                { name: 'Queens Drop-In Center' },
                { name: 'Union Hall Drop-In Center, Queens' },
                { name: 'Project Hospitality Drop-In Center, Staten Island' },
                {
                    name: 'The Ali Forney Center',
                    eligibility: [
                        {
                            age: 'under 18',
                            gender: ['transgender', 'non-binary', 'other'],
                            sexuality: ['asexual', 'bisexual', 'gay', 'lesbian', 'queer', 'pansexual', 'other']
                        }
                    ]
                },
                {
                    name: 'The Door, supportive services for youth',
                    eligibility: [
                        { age: 'under 18' }
                    ]
                },
                {
                    name: 'Covenant House, supportive services for youth',
                    eligibility: [
                        { age: 'under 18' }
                    ]
                },
                {
                    name: 'Rising Ground Safe Spaces Drop-In Center',
                    eligibility: [
                        { age: 'under 18' }
                    ]
                },
                {
                    name: 'Brooklyn Youth Center',
                    eligibility: [
                        { age: 'under 18' }
                    ]
                }
            ],
            portland: [
                { name: 'Behavioral Health Resource Center' },
                { name: 'Bud Clark Commons Resource Center' },
                { name: 'The Oasis Day Center' },
                { name: 'JOIN Dayspace' },
                { name: 'Bud Clark Commons Resource Center' },
                { name: 'North Portland Drop-In Center' },
                { name: 'St. Francis Day Center' },
                {
                    name: 'Outside In Day Shelter',
                    eligibility: [
                        { age: 'under 18' }
                    ]
                },
                {
                    name: 'Africa House Day Center',
                    eligibility: [
                        { age: 'under 18' }
                    ]
                },
                {
                    name: 'Marie Equi Center – Trans & Queer Service Center',
                    eligibility: [
                        {
                            gender: ['transgender', 'non-binary', 'other'],
                            sexuality: ['asexual', 'bisexual', 'gay', 'lesbian', 'queer', 'pansexual', 'other']
                        }
                    ]
                },
                {
                    name: 'HIV Day Center',
                    eligibility: [
                        { disability: 'HIV/AIDS' }
                    ]
                },
                {
                    name: 'Rose Haven Day Center',
                    eligibility: [
                        {
                            gender: ['transgender', 'non-binary', 'other'],
                            presentation: ['feminine', 'androgynous']
                        }
                    ]
                }
            ]
        }
    },
    recreation_centers: {
        label: 'a recreation center',
        description: `Recreation centers, particularly free municipal recreation centers, offer a pleasant safe space to pass the time with entertainment for persons experiencing homelessness.`
    },
    gyms: {
        label: 'a gym',
        description: `Some people without a regular place to sleep at night may join a gym to gain access to safe and clean shower and bathroom facilities.`
    },
    medical_clinics: {
        label: 'a medical clinic',
        description: `For most persons experiencing homelessness who have at least one disability or serious medical condition, much time can be spent at medical clinics seeking treatment, particularly because homelessness tends to worsen illnesses and amplify comorbid conditions, leading to substantial medical complications that require frequent treatment from multiple specialists.`
    },
    hospitals: {
        label: 'a hospital',
        description: `For some persons experiencing homelessness, they may spend time at hospitals due to severe medical conditions(worsened by experiencing homelessness), or may find themselves in the Emergency Department due to exposure to hazards from living in places not meant for human habitation, the increased risk of experiencing violence due to being unhoused, or because being in the ED is simply safer and more preferable to living outdoors.Because medical providers are more likely to distrust and minimize the medical symptoms of persons experiencing homelessness, this can lead to long periods of time spent in hospitals.`
    },
    big_box_parking: {
        label: 'a big box store parking lot',
        description: `For unhoused persons who are living in a personal vehicle, the parking lots of big box stores are a safer option to park their vehicle and spend time because they are relatively public and well lit.`
    },
    municipal_parking: {
        label: 'a low-traffic municipal parking lot',
        description: `For unhoused persons who are living in a personal vehicle, they may choose to park their vehicle in a municipal parking lot where they're not likely to attract attention because they're less likely to experience harassment from property owners, police, and others.`
    },
    day_labor: {
        label: 'a day labor facility',
        description: `In cities with day labor facilities, it's common particularly for men experiencing homelessness to spend time at day labor centers waiting to be selected for an employment opportunity which often involves manual labor.`
    },
    public_transportation: {
        label: 'public transportation',
        description: `Public transportation can offer respite, particularly from the elements on extremely hot or cold days, as well as a relatively safe public space to spend time.`
    },
    workplaces: {
        label: 'a workplace',
        description: `Contrary to common perception, many people experiencing homelessness have a job or even multiple jobs that they work at as they navigate the costs of medical care, debt, transportation, food, and fees associated with getting back into housing.`
    },
    friends_homes: {
        label: 'a home of friends or family',
        description: `For some persons experiencing homelessness, they may have friends or family that they can stay with or "couch surf" temporarily while navigating their housing instability.It's difficult to know how many people experience this type of homelessness because it's often not obvious to outside observers.`
    },
    school: {
        label: 'a school',
        description: `For youth experiencing homelessness or young adults experiencing homelessness while enrolled in higher education, schools are safe places that provide useful access to the internet, food, social connection, and comfortable spaces to spend time.`
    }
};