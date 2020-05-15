import {
    IConfigurationExtend,
    IEnvironmentRead,
    ILogger,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { QuickMessageCommand } from './command/QuickMessageCommand';
import { MessageStorageManager } from './storage/MessageStorageManager';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';

export class QuickMessageApp extends App {

    private storageManager: MessageStorageManager;

    constructor(info: IAppInfo, logger: ILogger) {
        super(info, logger);
        this.storageManager = new MessageStorageManager();
    }

    public getStorageManager(): MessageStorageManager {
        return this.storageManager;
    }

    protected async extendConfiguration(configuration: IConfigurationExtend, environmentRead: IEnvironmentRead): Promise<void> {
        await configuration.slashCommands.provideSlashCommand(new QuickMessageCommand(this))
    }

}
