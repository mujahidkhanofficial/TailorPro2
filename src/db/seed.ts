import { db } from './database';
import { faker } from '@faker-js/faker';

export const seedCustomers = async (count: number = 30) => {
    const customers = [];

    for (let i = 0; i < count; i++) {
        customers.push({
            name: faker.person.fullName(),
            phone: faker.string.numeric('03#########'),
            address: faker.location.streetAddress(),
            gender: 'MALE', // Assuming mostly male customers for a tailor shop context, can be randomized if needed
            createdAt: new Date(),
            updatedAt: new Date(),
            measurements: {
                fields: {
                    // Random measurements for a typical Shalwar Kameez
                    length: faker.number.int({ min: 36, max: 44 }).toString(),
                    shoulder: faker.number.int({ min: 16, max: 20 }).toString(),
                    sleeves: faker.number.int({ min: 22, max: 26 }).toString(),
                    chest: faker.number.int({ min: 20, max: 26 }).toString(),
                    waist: faker.number.int({ min: 20, max: 40 }).toString(),
                    neck: faker.number.int({ min: 14, max: 18 }).toString(),
                    shalwarLength: faker.number.int({ min: 36, max: 42 }).toString(),
                    bottom: faker.number.int({ min: 6, max: 18 }).toString(),
                },
                designOptions: {
                    // Randomize some boolean design options
                    frontPocket: faker.datatype.boolean(),
                    sidePocket: faker.datatype.boolean(),
                    shalwarPocket: faker.datatype.boolean(),
                },
                notes: faker.lorem.sentence(),
                updatedAt: new Date()
            }
        });
    }

    await db.customers.bulkAdd(customers);
    console.log(`Successfully added ${count} mock customers!`);
};
