const axios = require("axios");
const fs = require("fs");

const telegramBotToken = "7656702265:AAEWDpC40X6ArL1e6ieD6meX0hWac1CXpiQ";
const chatId = "1359954927"; // Thay thế bằng chat ID của bạn

const sendMessage = async (message) => {
    const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;

    try {
        const response = await axios.post(url, {
            chat_id: chatId,
            text: message,
        });

        if (response.data.ok) {
            console.log("Message sent successfully:", message);
        } else {
            console.error("Error sending message:", response.data.description);
        }
    } catch (error) {
        console.error("Error with axios request:", error);
    }
};

// Đọc dữ liệu từ file JSON
const readOldTokenList = () => {
    try {
        const data = fs.readFileSync("tokens.json", "utf8");
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading the file", error);
        return [];
    }
};

// Lưu danh sách token cũ vào file JSON
const saveOldTokenList = (tokenList) => {
    try {
        fs.writeFileSync("tokens.json", JSON.stringify(tokenList, null, 2));
    } catch (error) {
        console.error("Error saving the file", error);
    }
};

// Crawl data
const getDataFourMeme = async () => {
    const params = {
        orderBy: "TimeDesc",
        tokenName: "",
        listedPancake: true,
        pageIndex: 1,
        pageSize: 300,
        symbol: "",
        labels: "",
    };

    const queryString = new URLSearchParams(params).toString();
    const url = `https://four.meme/meme-api/v1/private/token/query?${queryString}`;

    try {
        const response = await axios.get(url);
        if (response.data.msg === "success") {
            return response.data.data;
        } else {
            console.error("Error: Unexpected response status", response.status);
        }
    } catch (error) {
        console.error("Error with axios request:", error);
    }
};

// Hàm để tìm token mới
const findNewlyListedToken = (oldList, newList) => {
    // Tìm các token mới trong newList mà không có trong oldList
    const newTokens = newList.filter((newToken) => {
        return !oldList.some((oldToken) => oldToken.id === newToken.id); // So sánh theo ID
    });
    return newTokens;
};

// Lưu danh sách token cũ và mới, và so sánh
const main = async () => {
    const newTokenList = await getDataFourMeme(); // Lấy danh sách token mới

    if (newTokenList) {
        const oldTokenList = readOldTokenList(); // Đọc danh sách token cũ từ file

        // Tìm token mới
        const newlyListedTokens = findNewlyListedToken(
            oldTokenList,
            newTokenList
        );

        if (newlyListedTokens.length > 0) {
            newlyListedTokens.forEach((tokenData) => {
                let message = `
                    ![${tokenData.name}](${tokenData.image})

                    **${tokenData.name}** - ${tokenData.shortName}
                    ${tokenData.address}

                    🔍Token
                    ├ Market Cap: ${tokenData.tokenPrice.marketCap}
                    └ 5M: ${tokenData.tokenPrice.amount} tx | Volume: ${tokenData.tokenPrice.tradingUsd}

                    **DEV:** 🟢 (${tokenData.tokenPrice.increase}%)
                    └Dex Paid: ❌ | CTO: ❌

                    **TH:** ${tokenData.raisedAmount} (total) Top 10: 31.9%

                    🔍Early:70 buyers
                    ├ Sum 🅑:99.14% | Hold 🅗: 31.71%
                    ├ 🟠 Transferred 0 | 🔵 Buy More 3
                    └ 🔴 Hold 9 | 🟡 Sold part 39 | 🟢 sold 19

                    📈DS • DT • GMGN
                `;

                // Nếu có Twitter Link, thêm vào tin nhắn
                if (tokenData.twitterUrl) {
                    message += `\n📈[Twitter Link](${tokenData.twitterUrl})`;
                }

                // Gửi tin nhắn Telegram
                sendMessage(message);
            });
        } else {
            console.log("No new tokens listed.");
        }

        // Cập nhật lại danh sách cũ với danh sách mới
        saveOldTokenList(newTokenList);
    }
};

// Lặp lại việc gọi hàm mỗi 5 phút (300000 ms)
setInterval(main, 300000);

// Gọi lần đầu để bắt đầu
main();
