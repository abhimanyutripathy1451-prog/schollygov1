export const getRankTitle = (level: number): string => {
    if (level < 10) return "Novice";
    if (level < 20) return "Adept";
    if (level < 35) return "Scholar";
    if (level < 50) return "Elite";
    return "Legend";
};
