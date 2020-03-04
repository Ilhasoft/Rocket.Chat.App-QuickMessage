import { ISlashCommand, ISlashCommandPreview, ISlashCommandPreviewItem, SlashCommandPreviewItemType } from "@rocket.chat/apps-engine/definition/slashcommands";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { IRead, IModify, IHttp, IPersistence } from "@rocket.chat/apps-engine/definition/accessors";
import { QuickMessageApp } from "../QuickMessageApp";
import { InvalidCommandError } from "./InvalidCommandError";
import { IOperationArgs } from "./IOperationArgs";

export class QuickMessageCommand implements ISlashCommand {

    private static readonly ERROR_INVALIDargs_FMT = "Invalid args format.";
    private static readonly TEXT_INVALID_COMMAND = 'Invalid command format! Type `/quick-message info` to see instructions.\n';
    private static readonly TEXT_USAGE_INFO = '**Instructions**:\n\n' +
        '/quick-message **list**\n' +
        '/quick-message **send** "id"\n' +
        '/quick-message **new** "id" "text"\n' +
        '/quick-message **edit** "id" "text"\n' +
        '/quick-message **delete** "id"';

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
            return await this.handleInvalidUsage(context, modify);
        }
        const operation = context.getArguments()[0];
        let args: IOperationArgs;

        try {
            switch (operation) {
                case "info":
                    return this.sendNotifyMessage(context, modify, QuickMessageCommand.TEXT_USAGE_INFO);
                case "list":
                    return this.handleMessageList(context, read, modify, persis);
                case "send":
                    args = this.getOperationArgs(context.getArguments());
                    return await this.handleMessageSending(context, read, modify, persis, args.id);
                case "new":
                    args = this.getOperationArgs(context.getArguments(), true);
                    return await this.handleMessageNew(context, read, modify, persis, args.id, args.text!);
                case "edit":
                    args = this.getOperationArgs(context.getArguments(), true);
                    return await this.handleMessageEdit(context, read, modify, persis, args.id, args.text!);
                case "delete":
                    args = this.getOperationArgs(context.getArguments());
                    return await this.handleMessageDelete(context, read, modify, persis, args.id);
                default:
                    return await this.handleInvalidUsage(context, modify);
            }
        } catch (error) {
            if (error instanceof InvalidCommandError) {
                return await this.handleInvalidUsage(context, modify);
            } else {
                this.app.getLogger().error(error);
                console.log("Error:", error);
                return await this.sendNotifyMessage(
                    context,
                    modify,
                    `An error occurred when trying perform **${operation}** operation :disappointed_relieved:`
                );
            }
        }
    }

    private getOperationArgs(args: Array<string>, requireTextArg: boolean = false): IOperationArgs {
        if (args.length < 2) {
            throw new InvalidCommandError(QuickMessageCommand.ERROR_INVALIDargs_FMT);
        }
        args = args.slice(1, args.length);

        if (args.length == 1 && !requireTextArg) {
            return { id: args[0] };
        }
        const beginTextArg = args[1];
        const endTextArg = args[args.length - 1];

        if (beginTextArg[0] != '"' || endTextArg[endTextArg.length - 1] != '"') {
            throw new InvalidCommandError(QuickMessageCommand.ERROR_INVALIDargs_FMT);
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

        return await modify.getNotifier().notifyUser(context.getSender(), message);
    }

    private async handleInvalidUsage(context: SlashCommandContext, modify: IModify): Promise<void> {
        return await this.sendNotifyMessage(context, modify, QuickMessageCommand.TEXT_INVALID_COMMAND);
    }

    private async handleMessageList(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        persis: IPersistence
    ): Promise<void> {
        return await this.sendNotifyMessage(context, modify, "onHandleMessagesList");
    }

    private async handleMessageSending(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        persis: IPersistence,
        messageId: string
    ): Promise<void> {
        return await this.sendNotifyMessage(context, modify, "onHandleMessageSending");
    }

    private async handleMessageNew(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        persis: IPersistence,
        messageId: string,
        messageText: string
    ): Promise<void> {
        return await this.sendNotifyMessage(context, modify, "onHandleMessageNew");
    }

    private async handleMessageEdit(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        persis: IPersistence,
        messageId: string,
        messageText: string
    ): Promise<void> {
        return await this.sendNotifyMessage(context, modify, "onHandleMessageEdit");
    }

    private async handleMessageDelete(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        persis: IPersistence,
        messageId: string
    ): Promise<void> {
        return await this.sendNotifyMessage(context, modify, "onHandleMessageDelete");
    }

}
