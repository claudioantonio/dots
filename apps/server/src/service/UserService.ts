import Player from "../logic/Player";

class UserService {
    private static INSTANCE: UserService;
    currentID: number;

    private constructor() {
        this.currentID = 1;
    }

    static getInstance(): UserService {
        if (!UserService.INSTANCE) {
            UserService.INSTANCE = new UserService();
        }
        return UserService.INSTANCE;
    }

    createPlayer(name: string): Player {
        let id = this.createPlayerId();
        return new Player(id, name);
    }

    private createPlayerId(): number {
        return this.currentID++;
    }
}

export { UserService }