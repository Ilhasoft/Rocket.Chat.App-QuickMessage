import { IPersistence, IPersistenceRead, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { IMessageData } from "./IMessageData";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { RocketChatAssociationRecord, RocketChatAssociationModel } from "@rocket.chat/apps-engine/definition/metadata";
import { MessageStorageError } from "./MessageStorageError";

export class MessageStorageManager {

    // Own error messages
    private static readonly ERR_MESSAGE_NOT_FOUND = "Message not found.";
    private static readonly ERR_INVALID_MESSAGE_ID = "Invalid message id.";
    private static readonly ERR_MESSAGE_ALREADY_EXISTS = "A message with the given id already exists.";
    // Association ID to retrieve all storaged messages
    private static readonly ASSOC_ID_GLOBAL = "message_storage_manager";

    public async read(read: IRead, messageId: string): Promise<IMessageData> {
        const data = await this.getMessageData(read, messageId);

        if (data == null) {
            throw new MessageStorageError(MessageStorageManager.ERR_MESSAGE_NOT_FOUND);
        }
        return new Promise<IMessageData>(resolve => resolve(data));
    }

    public async readAll(read: IRead): Promise<Array<IMessageData>> {
        const assoc = this.newGlobalAssociation();
        const objs = await read.getPersistenceReader().readByAssociation(assoc) as Array<IMessageData>;

        return new Promise<Array<IMessageData>>(resolve => resolve(objs));
    }

    public async create(
        context: SlashCommandContext,
        read: IRead,
        persis: IPersistence,
        messageId: string,
        messageText: string
    ): Promise<void> {
        if (messageId == MessageStorageManager.ASSOC_ID_GLOBAL) {
            throw new MessageStorageError(MessageStorageManager.ERR_INVALID_MESSAGE_ID);
        }
        let data = await this.getMessageData(read, messageId);

        if (data != null) {
            throw new MessageStorageError(MessageStorageManager.ERR_MESSAGE_ALREADY_EXISTS);
        }
        const now = new Date();
        const user = context.getSender();
        data = {
            id: messageId,
            text: messageText,
            createdAt: now,
            updatedAt: now,
            createdBy: user,
            updatedBy: user
        };
        const globalAssoc = this.newGlobalAssociation();
        const messageAssoc = this.newMessageAssociation(messageId);
        // Save reference to the storaged object in global association
        data.globalRecordId = await persis.createWithAssociation(data, globalAssoc);
        await persis.createWithAssociation(data, messageAssoc);
    }

    /**
     * Don't use this method yet because it is not implemented in the Rocket Chat persistence source:
     * https://github.com/RocketChat/Rocket.Chat/blob/e9890aaaff1ddfb99f1687ad8be55b8864db180b/app/apps/server/bridges/persistence.js#L93
    */
    public async update(
        context: SlashCommandContext,
        read: IRead,
        persis: IPersistence,
        messageId: string,
        messageText: string
    ): Promise<void> {
        const oldData = await this.getMessageData(read, messageId);

        if (oldData == null) {
            throw new MessageStorageError(MessageStorageManager.ERR_MESSAGE_NOT_FOUND);
        }
        const now = new Date();
        const user = context.getSender();
        const newData: IMessageData = {
            id: messageId,
            globalRecordId: oldData.globalRecordId,
            text: messageText,
            createdAt: oldData.createdAt,
            updatedAt: now,
            createdBy: oldData.createdBy,
            updatedBy: user
        };
        const messageAssoc = this.newMessageAssociation(messageId);
        await persis.updateByAssociation(messageAssoc, newData, false);
        // Save object in global association
        delete newData.globalRecordId;
        await persis.update(oldData.globalRecordId!, newData, false);
    }

    public async remove(read: IRead, persis: IPersistence, messageId: string): Promise<void> {
        const data = await this.getMessageData(read, messageId);;

        if (data == null) {
            throw new MessageStorageError(MessageStorageManager.ERR_MESSAGE_NOT_FOUND);
        }
        const assoc = this.newMessageAssociation(messageId);
        // Remove from both associations
        await persis.removeByAssociation(assoc);
        await persis.remove(data.globalRecordId!);
    }

    private newMessageAssociation(messageId: string): RocketChatAssociationRecord {
        return new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, messageId);
    }

    private newGlobalAssociation(): RocketChatAssociationRecord {
        return new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, MessageStorageManager.ASSOC_ID_GLOBAL);
    }

    private async getMessageData(read: IRead, messageId: string): Promise<IMessageData | null> {
        const assoc = this.newMessageAssociation(messageId);
        const objs = await read.getPersistenceReader().readByAssociation(assoc);

        return new Promise<IMessageData | null>(resolve => resolve(objs.length > 0 ? objs[0] as IMessageData : null));
    }

}
