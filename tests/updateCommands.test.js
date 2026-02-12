import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';

import { resetClientFactoryOverrides, setClientFactoryOverrides } from '../src/clientFactories.js';
import state from '../src/state.js';
import storage from '../src/storage.js';
import utils from '../src/utils.js';

await storage.ensureInitialized();

const importDiscordHandler = async (tag) => (
  (await import(`../src/discordHandler.js?test=${encodeURIComponent(tag)}`)).default
);

const createInteraction = ({ channelId, commandName = 'checkupdate' }) => {
  const records = {
    deferReply: [],
    editReply: [],
    followUp: [],
    reply: [],
  };
  return {
    channelId,
    channel: { id: channelId },
    commandName,
    options: {
      getString: () => null,
      getBoolean: () => null,
      getInteger: () => null,
      getNumber: () => null,
      getChannel: () => null,
      getUser: () => null,
    },
    isButton: () => false,
    isCommand: () => true,
    isChatInputCommand: () => true,
    async deferReply(payload) {
      records.deferReply.push(payload);
    },
    async editReply(payload) {
      records.editReply.push(payload);
      return payload;
    },
    async followUp(payload) {
      records.followUp.push(payload);
      return payload;
    },
    async reply(payload) {
      records.reply.push(payload);
      return payload;
    },
    records,
  };
};

class FakeDiscordClient extends EventEmitter {
  constructor() {
    super();
    this.user = { id: 'bot-1' };
  }

  async login() {
    queueMicrotask(() => this.emit('ready'));
    return this;
  }
}

test('/checkupdate in control channel refreshes persistent prompt without duplicate full update reply', async () => {
  const originalDiscordUtils = {
    getGuild: utils.discord.getGuild,
    getControlChannel: utils.discord.getControlChannel,
    syncUpdatePrompt: utils.discord.syncUpdatePrompt,
    syncRollbackPrompt: utils.discord.syncRollbackPrompt,
  };
  const originalUpdater = {
    run: utils.updater.run,
    formatUpdateMessage: utils.updater.formatUpdateMessage,
  };
  const originalSettings = {
    Token: state.settings.Token,
    GuildID: state.settings.GuildID,
    ControlChannelID: state.settings.ControlChannelID,
  };
  const originalUpdateInfo = state.updateInfo;
  const originalDcClient = state.dcClient;

  try {
    state.settings.Token = 'TEST_TOKEN';
    state.settings.GuildID = 'guild';
    state.settings.ControlChannelID = 'control';
    state.updateInfo = null;

    utils.discord.getGuild = async () => ({ commands: { set: async () => {} } });
    utils.discord.getControlChannel = async () => ({ send: async () => {} });
    const syncCalls = { update: 0, rollback: 0 };
    utils.discord.syncUpdatePrompt = async () => {
      syncCalls.update += 1;
    };
    utils.discord.syncRollbackPrompt = async () => {
      syncCalls.rollback += 1;
    };

    utils.updater.run = async () => {
      state.updateInfo = {
        currVer: '1.0.0',
        version: '1.1.0',
        channel: 'stable',
        changes: 'Fixes',
        canSelfUpdate: true,
      };
    };
    let formatCallCount = 0;
    utils.updater.formatUpdateMessage = () => {
      formatCallCount += 1;
      return 'UPDATE_MESSAGE';
    };

    const fakeClient = new FakeDiscordClient();
    setClientFactoryOverrides({ createDiscordClient: () => fakeClient });
    const discordHandler = await importDiscordHandler('checkupdate-control');
    state.dcClient = await discordHandler.start();
    await delay(0);

    const interaction = createInteraction({ channelId: 'control', commandName: 'checkupdate' });
    fakeClient.emit('interactionCreate', interaction);
    await delay(0);

    assert.equal(syncCalls.update, 1);
    assert.equal(syncCalls.rollback, 1);
    assert.equal(formatCallCount, 0);
    assert.deepEqual(interaction.records.deferReply, [{ ephemeral: false }]);
    assert.equal(interaction.records.editReply.length, 1);
    assert.equal(
      interaction.records.editReply[0]?.content,
      'Update available. The persistent update prompt in this channel has been refreshed.',
    );
    assert.equal(interaction.records.followUp.length, 0);
  } finally {
    utils.discord.getGuild = originalDiscordUtils.getGuild;
    utils.discord.getControlChannel = originalDiscordUtils.getControlChannel;
    utils.discord.syncUpdatePrompt = originalDiscordUtils.syncUpdatePrompt;
    utils.discord.syncRollbackPrompt = originalDiscordUtils.syncRollbackPrompt;
    utils.updater.run = originalUpdater.run;
    utils.updater.formatUpdateMessage = originalUpdater.formatUpdateMessage;

    state.settings.Token = originalSettings.Token;
    state.settings.GuildID = originalSettings.GuildID;
    state.settings.ControlChannelID = originalSettings.ControlChannelID;
    state.updateInfo = originalUpdateInfo;
    state.dcClient = originalDcClient;
    resetClientFactoryOverrides();
  }
});

test('/checkupdate outside control channel still returns full update details', async () => {
  const originalDiscordUtils = {
    getGuild: utils.discord.getGuild,
    getControlChannel: utils.discord.getControlChannel,
    syncUpdatePrompt: utils.discord.syncUpdatePrompt,
    syncRollbackPrompt: utils.discord.syncRollbackPrompt,
  };
  const originalUpdater = {
    run: utils.updater.run,
    formatUpdateMessage: utils.updater.formatUpdateMessage,
  };
  const originalSettings = {
    Token: state.settings.Token,
    GuildID: state.settings.GuildID,
    ControlChannelID: state.settings.ControlChannelID,
  };
  const originalUpdateInfo = state.updateInfo;
  const originalDcClient = state.dcClient;

  try {
    state.settings.Token = 'TEST_TOKEN';
    state.settings.GuildID = 'guild';
    state.settings.ControlChannelID = 'control';
    state.updateInfo = null;

    utils.discord.getGuild = async () => ({ commands: { set: async () => {} } });
    utils.discord.getControlChannel = async () => ({ send: async () => {} });
    utils.discord.syncUpdatePrompt = async () => {};
    utils.discord.syncRollbackPrompt = async () => {};

    utils.updater.run = async () => {
      state.updateInfo = {
        currVer: '1.0.0',
        version: '1.1.0',
        channel: 'stable',
        changes: 'Fixes',
        canSelfUpdate: true,
      };
    };
    utils.updater.formatUpdateMessage = () => 'UPDATE_MESSAGE';

    const fakeClient = new FakeDiscordClient();
    setClientFactoryOverrides({ createDiscordClient: () => fakeClient });
    const discordHandler = await importDiscordHandler('checkupdate-non-control');
    state.dcClient = await discordHandler.start();
    await delay(0);

    const interaction = createInteraction({ channelId: 'not-control', commandName: 'checkupdate' });
    fakeClient.emit('interactionCreate', interaction);
    await delay(0);

    assert.deepEqual(interaction.records.deferReply, [{ ephemeral: true }]);
    assert.equal(interaction.records.editReply.length, 1);
    assert.equal(interaction.records.editReply[0]?.content, 'UPDATE_MESSAGE');
    assert.ok(Array.isArray(interaction.records.editReply[0]?.components));
    assert.equal(interaction.records.editReply[0]?.components?.length, 1);
  } finally {
    utils.discord.getGuild = originalDiscordUtils.getGuild;
    utils.discord.getControlChannel = originalDiscordUtils.getControlChannel;
    utils.discord.syncUpdatePrompt = originalDiscordUtils.syncUpdatePrompt;
    utils.discord.syncRollbackPrompt = originalDiscordUtils.syncRollbackPrompt;
    utils.updater.run = originalUpdater.run;
    utils.updater.formatUpdateMessage = originalUpdater.formatUpdateMessage;

    state.settings.Token = originalSettings.Token;
    state.settings.GuildID = originalSettings.GuildID;
    state.settings.ControlChannelID = originalSettings.ControlChannelID;
    state.updateInfo = originalUpdateInfo;
    state.dcClient = originalDcClient;
    resetClientFactoryOverrides();
  }
});
