import { ISlashCommand, ISlashCommandPreview, ISlashCommandPreviewItem, SlashCommandPreviewItemType } from "@rocket.chat/apps-engine/definition/slashcommands";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { IRead, IModify, IHttp, IPersistence } from "@rocket.chat/apps-engine/definition/accessors";
import { QuickMessageApp } from "../QuickMessageApp";
import { CommandError } from "./CommandError";
import { ICommandArgs } from "./ICommandArgs";
import { MessageStorageError } from "../storage/MessageStorageError";

export class QuickMessageCommand implements ISlashCommand {

    // Own error messages
    private static readonly ERR_INVALID_COMMAND = "Invalid command format.";
    // Own texts to send as notify messages
    private static readonly TXT_INVALID_COMMAND = ':x: Invalid command format! Type `/quick-message help` to see instructions.';
    private static readonly TXT_USAGE_INFO = 'QuickMessage is a Rocket.Chat app for handling repetitive messages, providing a way to ' +
        'store template messages related to a specific id for all users. Available operations:\n\n' +
        'To see this help:         `/quick-message help`\n' +
        'To list created messages: `/quick-message list`\n' +
        'To send a message:        `/quick-message send id`          (e.g. /quick-message send good-morning)\n' +
        'To create a message:      `/quick-message create id "text"` (e.g. /quick-message create good-morning "Good morning yall!!")\n' +
        'To remove a message:      `/quick-message remove id`        (e.g. /quick-message remove good-morning)\n\n' +
        'IMPORTANT: available characters for message id are in **A-Z**, **a-z**, **0-9** or **"-"**.';

    public command: string;
    public i18nParamsExample: string;
    public i18nDescription: string;
    public providesPreview: boolean;

    constructor(private readonly app: QuickMessageApp) {
        this.command = "quick-message";
        this.i18nParamsExample = "quickMessageParamExample";
        this.i18nDescription = "quickMessageDescription";
        this.providesPreview = false;
    }

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<void> {
        if (context.getArguments().length == 0) {
            return await this.onInvalidUsage(context, modify);
        }
        const operation = context.getArguments()[0];
        let args: ICommandArgs;

        try {
            switch (operation) {
                case "help":
                    return this.sendNotifyMessage(context, modify, QuickMessageCommand.TXT_USAGE_INFO);
                case "list":
                    return this.onListMessages(context, read, modify);
                case "send":
                    await this.onRunningCommand(context, modify);
                    args = this.getOperationArgs(context.getArguments());
                    return await this.onSendMessage(context, read, modify, args.id);
                case "create":
                    await this.onRunningCommand(context, modify);
                    args = this.getOperationArgs(context.getArguments(), true);
                    return await this.onCreateMessage(context, read, modify, persis, args.id, args.text!);
                case "remove":
                    await this.onRunningCommand(context, modify);
                    args = this.getOperationArgs(context.getArguments());
                    return await this.onRemoveMessage(context, read, modify, persis, args.id);
                default:
                    return await this.onInvalidUsage(context, modify);
            }
        } catch (error) {
            if (error instanceof CommandError) {
                return await this.onInvalidUsage(context, modify);
            }
            this.app.getLogger().error(error);
            let errorMessage = ":x: An error occurred";

            try {
                error = error as MessageStorageError;
                errorMessage = errorMessage.concat(`: ${error.message}`);
            } catch (castingError) { }

            return await this.sendNotifyMessage(context, modify, errorMessage);
        }
    }

    private getOperationArgs(args: Array<string>, requireTextArg: boolean = false): ICommandArgs {
        if (args.length < 2) {
            throw new CommandError(QuickMessageCommand.ERR_INVALID_COMMAND);
        }
        args = args.slice(1, args.length);

        if (!requireTextArg && args.length == 1) {
            return { id: args[0] };
        } else if (!requireTextArg) {
            throw new CommandError(QuickMessageCommand.ERR_INVALID_COMMAND);
        }
        const beginTextArg = args[1];
        const endTextArg = args[args.length - 1];

        if (beginTextArg[0] != '"' || endTextArg[endTextArg.length - 1] != '"') {
            throw new CommandError(QuickMessageCommand.ERR_INVALID_COMMAND);
        }
        let textArg = args.slice(1, args.length).join(' ');
        textArg = textArg.substring(1, textArg.length - 1);

        return { id: args[0], text: textArg };
    }

    private async sendNotifyMessage(context: SlashCommandContext, modify: IModify, text: string) {
        const message = modify.getCreator().startMessage()
            .setUsernameAlias("QuickMessage")
            .setEmojiAvatar(":speech_balloon:")
            .setText(text)
            .setRoom(context.getRoom())
            .setSender(context.getSender())
            .getMessage();

        await modify.getNotifier().notifyUser(context.getSender(), message);
    }

    private async sendMessage(context: SlashCommandContext, modify: IModify, text: string) {
        const messageBuilder = modify.getCreator().startMessage()
            .setRoom(context.getRoom())
            .setSender(context.getSender())
            .setText(text);

        await modify.getCreator().finish(messageBuilder);
    }

    private async onRunningCommand(context: SlashCommandContext, modify: IModify) {
        await this.sendNotifyMessage(context, modify, `:desktop: /quick-message ${context.getArguments().join(' ')}`);
    }

    private async onInvalidUsage(context: SlashCommandContext, modify: IModify) {
        await this.sendNotifyMessage(context, modify, QuickMessageCommand.TXT_INVALID_COMMAND);
    }

    private async onListMessages(context: SlashCommandContext, read: IRead, modify: IModify) {
        const messages = await this.app.getStorageManager().readAll(read);

        if (messages.length == 0) {
            return await this.sendNotifyMessage(context, modify, "No messages. :person_shrugging:");
        }
        let text = ":notepad_spiral: Created Messages";

        messages.forEach(message => {
            text = text.concat(`\n:small_blue_diamond: **${message.id}** - "${message.text}"`)
                .concat(`, created by **${message.createdBy.username}** at _${message.createdAt.toLocaleString()}_`);
        });
        await this.sendNotifyMessage(context, modify, text);
    }

    private async onSendMessage(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        messageId: string
    ) {
        const message = await this.app.getStorageManager().read(read, messageId);
        await this.sendMessage(context, modify, message.text);
    }

    private async onCreateMessage(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        persis: IPersistence,
        messageId: string,
        messageText: string
    ) {
        await this.app.getStorageManager().create(context, read, persis, messageId, messageText);
        await this.sendNotifyMessage(context, modify, `:white_check_mark: Message with the id "${messageId}" **created**.`);
    }

    private async onRemoveMessage(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        persis: IPersistence,
        messageId: string
    ) {
        await this.app.getStorageManager().remove(read, persis, messageId);
        await this.sendNotifyMessage(context, modify, `:white_check_mark: Message with the id "${messageId}" **removed**.`);
    }

}
