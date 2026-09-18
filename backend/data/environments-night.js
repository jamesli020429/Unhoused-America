// environments-day.js

// Key = internal identifier you use in your UI / logic.
// value.label = human-readable label the model should see.
// value.description = short, concrete description you want in the context.
export const NIGHT_ENVIRONMENTS = {
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
    overnight_shelters: {
        label: 'an overnight shelter',
        description: `A shelter that provides a safe place to sleep overnight for people experiencing homelessness. These shelters often offer beds, meals, and access to supportive services, but may have rules and limited capacity. People who stay at overnight shelters are required to vacate the premises during the day and may not be guaranteed a bed every night.`,
        resourcesPerCity: {
            atlanta: [
                { name: '' }
            ],
            boston: [
                { name: '' }
            ],
            dc: [
                { name: '' }
            ],
            LA: [
                { name: '' }
            ],
            NYC: [
                { name: '' }
            ],
            portland: [
                { name: '' }
            ]
        }
    },
    transitional_housing: {
        label: 'transitional housing',
        description: `Transitional housing is temporary, service-intensive housing for homeless individuals/families, bridging emergency shelters and permanent housing, offering up to 24 months of stability with support like job training, life skills, and counseling, to help residents achieve self-sufficiency and secure stable, independent living. Participants usually have a lease or agreement and pay a portion of their income as rent, with a focus on moving to permanent housing within a set timeframe.`,
        resourcesPerCity: {
            atlanta: [
                { name: '' }
            ],
            boston: [
                { name: '' }
            ],
            dc: [
                { name: '' }
            ],
            LA: [
                { name: '' }
            ],
            NYC: [
                { name: '' }
            ],
            portland: [
                { name: '' }
            ]
        }
    },
    friends_homes: {
        label: 'a home of friends or family',
        description: `For some persons experiencing homelessness, they may have friends or family that they can stay with or "couch surf" temporarily while navigating their housing instability.It's difficult to know how many people experience this type of homelessness because it's often not obvious to outside observers.`
    },
    vehicle: {
        label: 'a vehicle',
        description: `For some persons experiencing homelessness, living in a personal vehicle can provide a degree of safety, privacy, and shelter from the elements. Vehicles may serve as temporary homes and offer a place to store belongings. However, living in a vehicle also comes with challenges such as finding safe parking, access to restrooms, and legal restrictions.`
    }
};