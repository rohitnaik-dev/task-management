declare global {
    namespace Express {
        interface AuthenticatedUser {
            id: string;
            name: string;
            email: string;
            role: "user" | "admin";
        }

        interface Request {
            user?: AuthenticatedUser;
        }
    }
}

export {};