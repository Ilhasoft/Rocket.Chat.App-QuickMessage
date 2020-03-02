import { ISlashCommand, ISlashCommandPreview, ISlashCommandPreviewItem, SlashCommandPreviewItemType } from "@rocket.chat/apps-engine/definition/slashcommands";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { IRead, IModify, IHttp, IPersistence } from "@rocket.chat/apps-engine/definition/accessors";
import { QuickMessageApp } from "../QuickMessageApp";

export class QuickMessageCommand implements ISlashCommand {

    public command:           string;
    public i18nParamsExample: string;
    public i18nDescription:   string;
    public providesPreview:   boolean;

    constructor(private readonly app: QuickMessageApp) {
        this.command           = "quick-message";
        this.i18nParamsExample = "quickMessageParamExample";
        this.i18nDescription   = "quickMessageDescription";
        this.providesPreview   = false;
    }

    public async executor(
        context: SlashCommandContext,
        read:    IRead,
        modify:  IModify,
        http:    IHttp,
        persis:  IPersistence
    ): Promise<void> {
        if (context.getArguments().length == 0) {
            return await this.sendNotifyMessage(
                context,
                modify,
                'Usage:\n/quick-message **new**|**edit** "id" "text"\n/quick-message **send**|**delete** "id"'
            );
        }
        const operation = context.getArguments()[0];

        switch (operation) {
            case "send":
                return await this.sendNotifyMessage(
                    context,
                    modify,
                    "Invalid format!\nUsage: /quick-message **list**"
                );
            case "send":
                if (context.getArguments().length == 2) {
                    return await this.handleSendMessage(context, read, modify, persis, context.getArguments()[1]);
                } else {
                    return await this.sendNotifyMessage(
                        context,
                        modify,
                        'Invalid format!\nUsage: /quick-message **send** "id"'
                    );
                }
            case "new":
                if (context.getArguments().length == 3) {
                    return await this.handleMessageNew(context, read, modify, persis, context.getArguments()[1], context.getArguments()[2]);
                } else {
                    return await this.sendNotifyMessage(
                        context,
                        modify,
                        'Invalid format!\nUsage: /quick-message **new** "id" "text"'
                    );
                }
            case "edit":
                if (context.getArguments().length == 3) {
                    return await this.handleMessageEdit(context, read, modify, persis, context.getArguments()[1], context.getArguments()[2]);
                } else {
                    return await this.sendNotifyMessage(
                        context,
                        modify,
                        'Invalid format!\nUsage: /quick-message **edit** "id" "text"'
                    );
                }
            case "delete":
                if (context.getArguments().length == 2) {
                    return await this.handleMessageDelete(context, read, modify, persis, context.getArguments()[1]);
                } else {
                    return await this.sendNotifyMessage(
                        context,
                        modify,
                        'Invalid format!\nUsage: /quick-message **delete** "id"'
                    );
                }
            default:
                return await this.sendNotifyMessage(
                    context,
                    modify,
                    'Invalid operation! Use **list**, **send**, **new**, **edit** or **delete**.'
                );
        }
    }

    private async sendNotifyMessage(context: SlashCommandContext, modify: IModify, text: string): Promise<void> {
        const message = modify.getCreator().startMessage()
            .setUsernameAlias('Quick Message')
            .setEmojiAvatar(":speech_balloon:")
            .setText(text)
            .setRoom(context.getRoom())
            .setSender(context.getSender())
            .getMessage();

        return await modify.getNotifier().notifyUser(context.getSender(), message);
    }

    private async handleMessagesList(
        context: SlashCommandContext,
        read:    IRead,
        modify:  IModify,
        persis:  IPersistence
    ): Promise<void> {
        return await this.sendNotifyMessage(context, modify, "onHandleMessagesList");
    }

    private async handleSendMessage(
        context:   SlashCommandContext,
        read:      IRead,
        modify:    IModify,
        persis:    IPersistence,
        messageId: string
    ): Promise<void> {
        return await this.sendNotifyMessage(context, modify, "onHandleSendMessage");
    }

    private async handleMessageNew(
        context:     SlashCommandContext,
        read:        IRead,
        modify:      IModify,
        persis:      IPersistence,
        messageId:   string,
        messageText: string
    ): Promise<void> {
        return await this.sendNotifyMessage(context, modify, "onHandleMessageNew");
    }

    private async handleMessageEdit(
        context:     SlashCommandContext,
        read:        IRead,
        modify:      IModify,
        persis:      IPersistence,
        messageId:   string,
        messageText: string
    ): Promise<void> {
        return await this.sendNotifyMessage(context, modify, "onHandleMessageEdit");
    }

    private async handleMessageDelete(
        context:   SlashCommandContext,
        read:      IRead,
        modify:    IModify,
        persis:    IPersistence,
        messageId: string
    ): Promise<void> {
        return await this.sendNotifyMessage(context, modify, "onHandleMessageDelete");
    }

}
