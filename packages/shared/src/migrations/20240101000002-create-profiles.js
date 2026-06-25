"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Profiles", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: "Users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      display_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      avatar_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      language_preference: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: "en",
      },
      theme_preference: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "light",
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Profiles");
  },
};
