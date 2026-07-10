document.addEventListener("DOMContentLoaded", () => {
    // 注文ボタンと会計ボタンの取得
    const orderButton = document.getElementById("orderButton");
    const accountButton = document.getElementById("accountButton");
    // フォームの取得
    const form = document.forms["orderForm"];
    // 注文履歴を表示するコンテナの取得
    const historyContainer = document.getElementById("historyContainer");
    // 合計金額表示エリアの取得
    const grandTotalDisplay = document.getElementById("grandTotalDisplay");
    // 注文回数の初期化
    let orderNumber = 0;
    // 合計金額の初期化
    let grandTotal = 0;

    // 商品情報の配列（名前と価格）
    const products = [
        { name: "ビルマ・ボンブ", price: 600 },
        { name: "ビルマ・セモリーナー・ケーキ", price: 550 },
        { name: "カフェラテ", price: 520 },
        { name: "マンゴー・アイス・ケーキ", price: 800 },
        { name: "ミルク・クルフィ", price: 680 },
        { name: "ミャゼディコーヒー", price: 580 },
        { name: "モヒンガー", price: 1080 },
        { name: "サンドイッチ", price: 660 }
        ];

    // 入力値が0から始まる場合、先頭の0を削除して調整
    for (let i = 0; i < products.length; i++) {
        const input = form["qty" + i];
        input.addEventListener("input", () => {
            if (input.value.length > 1) {
            input.value = input.value.replace(/^0+/, '') || '0';
            }
        });
    }
    // 注文ボタン押下時の処理
    orderButton.addEventListener("click", () => {
        // 注文の確認ダイアログ
        if (!confirm("注文します。よろしいですか？")) return;
        // 今回の注文合計金額
        let orderTotal = 0;
         // 注文商品の配列
        let orderItems = [];

        // 各商品の数量を取得し、0より大きければ注文に追加
        for (let i = 0; i < products.length; i++) {
            const qty = parseInt(form["qty" + i].value) || 0;
            if (qty > 0) {
                const total = qty * products[i].price;
                orderItems.push({
                    name: products[i].name,
                    qty: qty,
                    total: total
                });
                orderTotal += total;
            }
        }

        // 全ての数量が0の場合は警告を表示して終了
        if (orderItems.length === 0) {
            alert("すべての注文個数は 0 です。");
            return;
        }
        // 注文回数をインクリメント
        orderNumber++;
        // 合計金額に今回注文分を加算
        grandTotal += orderTotal;

        // 注文履歴テーブルを作成
        const orderTable = document.createElement("table");
        orderTable.className = "order-history";

        // 注文回数のヘッダー行
        const header = document.createElement("tr");
        header.innerHTML = `<th colspan="3">注文 ${orderNumber} 回目</th>`;
        header.style.background = "#444";
        header.style.color = "#fff";
        orderTable.appendChild(header);

        // テーブルのタイトル行（商品名、数量、金額）
        const titleRow = document.createElement("tr");
        titleRow.innerHTML = `
            <th>商品名</th>
            <th>数量</th>
            <th>金額</th>`;
        orderTable.appendChild(titleRow);

        // 注文商品の行を追加
        orderItems.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.qty}</td>
            <td>${item.total}円</td>`;
        orderTable.appendChild(row);
        });

        // 注文合計行
        const subtotalRow = document.createElement("tr");
        subtotalRow.innerHTML = `
            <td colspan="2"><strong>${orderNumber}回目の合計</strong></td>
            <td><strong>${orderTotal}円</strong></td>`;
        orderTable.appendChild(subtotalRow);

        // 履歴コンテナに追加
        historyContainer.appendChild(orderTable);
        // 合計金額表示の更新
        grandTotalDisplay.textContent = `合計: ${grandTotal}円`;

        // フォームの数量をリセット
        for (let i = 0; i < products.length; i++) {
            form["qty" + i].value = 0;
        }
    });

    // 会計ボタン押下時の処理
    accountButton.addEventListener("click", () => {
        // 会計確認ダイアログ
        if (confirm("会計に行きますか？")) {
            // 合計金額を表示し、注文履歴と合計金額をリセット
            alert(`合計で ${grandTotal} 円でした。ありがとうございました！`);
            historyContainer.innerHTML = "";
            grandTotal = 0;
            orderNumber = 0;
            grandTotalDisplay.textContent = "合計: 0円";
        }
    });
});
