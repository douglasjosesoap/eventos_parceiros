let processedData = [];
let totalTokens = 0;
let duplicatedTokens = 0;

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
        
        const filteredData = jsonData.filter(row => row["payload.eventType"] === eventType);
        totalTokens = filteredData.length;
        
        const tokenCounts = {};
        filteredData.forEach(row => {
            const token = row["payload.token"];
            tokenCounts[token] = (tokenCounts[token] || 0) + 1;
        });
        
        const uniqueTokens = Object.keys(tokenCounts);
        duplicatedTokens = totalTokens - uniqueTokens.length;
        
        processedData = uniqueTokens.map(token => ({ Token: token, Eventos: tokenCounts[token] }));
        
        document.getElementById("summary").innerText = `Você recebeu ${totalTokens} tokens, dos quais ${duplicatedTokens} são duplicados.`;
    };
    reader.readAsArrayBuffer(fileInput);
}

function downloadFile() {
    if (processedData.length === 0) {
        alert("Nenhum dado para baixar.");
        return;
    }
    
    const uniqueTokens = processedData.filter(item => item.Eventos === 1);
    const duplicatedTokensList = processedData.filter(item => item.Eventos > 1);
    
    const wsUnique = XLSX.utils.json_to_sheet(uniqueTokens);
    const wsDuplicated = XLSX.utils.json_to_sheet(duplicatedTokensList);
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsUnique, "Tokens Únicos");
    XLSX.utils.book_append_sheet(wb, wsDuplicated, "Tokens Duplicados");
    
    XLSX.writeFile(wb, "tokens_processados.xlsx");
}
