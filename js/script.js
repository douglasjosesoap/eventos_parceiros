let processedData = [];
let summaryText = "";

function processFile() {
    const fileInput = document.getElementById("fileInput").files[0];
    const eventType = document.getElementById("eventType").value;
    if (!fileInput || !eventType) {
        alert("Por favor, selecione um arquivo e um tipo de evento.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        if (eventType === "ALL") {
            const eventMap = {};
            jsonData.forEach(row => {
                const evt = row["payload.eventType"];
                const token = row["payload.token"];
                if (!eventMap[evt]) eventMap[evt] = {};
                eventMap[evt][token] = (eventMap[evt][token] || 0) + 1;
            });

            processedData = [];
            for (const evt in eventMap) {
                for (const token in eventMap[evt]) {
                    processedData.push({ Evento: evt, Token: token, Eventos: eventMap[evt][token] });
                }
            }
            summaryText = `Resumo geral de todos os eventos. Total: ${processedData.length} registros.`;
        } else {
            const filteredData = jsonData.filter(row => row["payload.eventType"] === eventType);
            const totalTokens = filteredData.length;

            const tokenCounts = {};
            filteredData.forEach(row => {
                const token = row["payload.token"];
                tokenCounts[token] = (tokenCounts[token] || 0) + 1;
            });

            const uniqueTokens = Object.keys(tokenCounts);
            const duplicatedTokens = totalTokens - uniqueTokens.length;

            processedData = uniqueTokens.map(token => ({ Token: token, Eventos: tokenCounts[token] }));

            summaryText = `Total: ${totalTokens} tokens, ${uniqueTokens.length} únicos e ${duplicatedTokens} duplicados.`;
        }

        document.getElementById("summary").innerText = summaryText;
    };
    reader.readAsArrayBuffer(fileInput);
}

function downloadFile() {
    if (processedData.length === 0) {
        alert("Nenhum dado para baixar.");
        return;
    }

    const wb = XLSX.utils.book_new();

    if (document.getElementById("eventType").value === "ALL") {
        const wsAll = XLSX.utils.json_to_sheet(processedData);
        XLSX.utils.book_append_sheet(wb, wsAll, "Todos os Eventos");
    } else {
        const uniqueTokens = processedData.filter(item => item.Eventos === 1);
        const duplicatedTokensList = processedData.filter(item => item.Eventos > 1);

        const wsUnique = XLSX.utils.json_to_sheet(uniqueTokens);
        const wsDuplicated = XLSX.utils.json_to_sheet(duplicatedTokensList);

        XLSX.utils.book_append_sheet(wb, wsUnique, "Tokens Únicos");
        XLSX.utils.book_append_sheet(wb, wsDuplicated, "Tokens Duplicados");
    }

    XLSX.writeFile(wb, "tokens_processados.xlsx");
}
