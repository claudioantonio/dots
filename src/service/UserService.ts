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

    createPlayerId(): number {
        return this.currentID++;
    }
}

export { UserService }