import { ISlashCommand, ISlashCommandPreview, ISlashCommandPreviewItem, SlashCommandPreviewItemType } from "@rocket.chat/apps-engine/definition/slashcommands";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { IRead, IModify, IHttp, IPersistence } from "@rocket.chat/apps-engine/definition/accessors";
import { QuickMessageApp } from "../QuickMessageApp";
import { CommandError } from "./CommandError";
import { ICommandArgs } from "./ICommandArgs";

export class QuickMessageCommand implements ISlashCommand {

    // Own error messages
    private static readonly ERR_INVALID_COMMAND = "Invalid command format.";
    // Own texts to send as notify messages
    private static readonly TXT_INVALID_COMMAND = 'Invalid command format! Type `/quick-message info` to see instructions.\n';
    private static readonly TXT_USAGE_INFO = '**Instructions**:\n\n' +
        '/quick-message **help**\n' +
        '/quick-message **list**\n' +
        '/quick-message **send** "id"\n' +
        '/quick-message **create** "id" "text"\n' +
        '/quick-message **update** "id" "text"\n' +
        '/quick-message **remove** "id"';

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
                    return this.onListMessages(context, read, modify, persis);
                case "send":
                    args = this.getOperationArgs(context.getArguments());
                    return await this.onSendMessage(context, read, modify, persis, args.id);
                case "create":
                    args = this.getOperationArgs(context.getArguments(), true);
                    return await this.onCreateMessage(context, read, modify, persis, args.id, args.text!);
                case "update":
                    args = this.getOperationArgs(context.getArguments(), true);
                    return await this.onUpdateMessage(context, read, modify, persis, args.id, args.text!);
                case "remove":
                    args = this.getOperationArgs(context.getArguments());
                    return await this.onRemoveMessage(context, read, modify, persis, args.id);
                default:
                    return await this.onInvalidUsage(context, modify);
            }
        } catch (error) {
            if (error instanceof CommandError) {
                return await this.onInvalidUsage(context, modify);
            } else {
                this.app.getLogger().error(error);
                return await this.sendNotifyMessage(
                    context,
                    modify,
                    `An error occurred when trying perform **${operation}** operation :disappointed_relieved:`
                );
            }
        }
    }

    private getOperationArgs(args: Array<string>, requireTextArg: boolean = false): ICommandArgs {
        if (args.length < 2) {
            throw new CommandError(QuickMessageCommand.ERR_INVALID_COMMAND);
        }
        args = args.slice(1, args.length);

        if (args.length == 1 && !requireTextArg) {
            return { id: args[0] };
        }
        const beginTextArg = args[1];
        const endTextArg = args[args.length - 1];

        if (beginTextArg[0] != '"' || endTextArg[endTextArg.length - 1] != '"') {
            throw new CommandError(QuickMessageCommand.ERR_INVALID_COMMAND);
        }
        let textArg = args.slice(1, args.length).join(' ');
        textArg = textArg.substring(1, textArg.length);

        return { id: args[0], text: textArg };
    }

    private async sendNotifyMessage(context: SlashCommandContext, modify: IModify, text: string): Promise<void> {
        const message = modify.getCreator().startMessage()
            .setUsernameAlias("Quick Message")
            .setEmojiAvatar(":speech_balloon:")
            .setText(text)
            .setRoom(context.getRoom())
            .setSender(context.getSender())
            .getMessage();

        await modify.getNotifier().notifyUser(context.getSender(), message);
    }

    private async onInvalidUsage(context: SlashCommandContext, modify: IModify): Promise<void> {
        await this.sendNotifyMessage(context, modify, QuickMessageCommand.TXT_INVALID_COMMAND);
    }

    private async onListMessages(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        persis: IPersistence
    ): Promise<void> {
           
    }

    private async onSendMessage(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        persis: IPersistence,
        messageId: string
    ): Promise<void> {
        
    }

    private async onCreateMessage(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        persis: IPersistence,
        messageId: string,
        messageText: string
    ): Promise<void> {
        
    }

    private async onUpdateMessage(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        persis: IPersistence,
        messageId: string,
        messageText: string
    ): Promise<void> {
        
    }

    private async onRemoveMessage(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        persis: IPersistence,
        messageId: string
    ): Promise<void> {
        
    }

}
