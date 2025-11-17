'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const spaces = [];
    const totalSpaces = parseInt(process.env.TOTAL_PARKING_SPACES) || 100;
    const zones = ['A', 'B', 'C', 'D'];
    const floors = [1, 2, 3];

    let spaceCounter = 1;

    for (let floor of floors) {
      for (let zone of zones) {
        const spacesPerZone = Math.floor(totalSpaces / (floors.length * zones.length));

        for (let i = 1; i <= spacesPerZone; i++) {
          const spaceNumber = `${floor}${zone}${String(i).padStart(2, '0')}`;

          // Determine space type
          let type = 'regular';
          if (i === 1 || i === 2) {
            type = 'handicap';
          } else if (i === 3 || i === 4) {
            type = 'electric';
          } else if (i === spacesPerZone) {
            type = 'vip';
          }

          spaces.push({
            id: uuidv4(),
            space_number: spaceNumber,
            floor: floor,
            zone: zone,
            status: 'available',
            type: type,
            is_active: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });

          spaceCounter++;
          if (spaceCounter > totalSpaces) break;
        }
        if (spaceCounter > totalSpaces) break;
      }
      if (spaceCounter > totalSpaces) break;
    }

    return queryInterface.bulkInsert('parking_spaces', spaces);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('parking_spaces', null, {});
  }
};
