// utils/exportExcel.js
import XLSX from '@/common/utils/xlsx.full.min.js'

/**
 * 超简通用导出：直接传入 [{ "中文表头": "值" }] 格式数据
 * @param {Array} data - 已处理好的数据，key 为中文表头
 * @param {String} fileName - 文件名（不含扩展名）
 * @param {String} sheetName - Sheet名称
 * @param {Object} options - 可选配置
 */
export function exportExcel(data, fileName = '导出文件', sheetName = 'Sheet1', options = {}) {
	// 1. 基础校验
	if (!data || !Array.isArray(data) || data.length === 0) {
		uni.showToast({
			title: '暂无数据可导出',
			icon: 'none'
		})
		return false
	}

	try {
		// 2. 数据预处理（可选）
		const processedData = data.map(item => {
			const row = {}
			for (let key in item) {
				if (key == 'undefined') continue
				let value = item[key]

				// 空值处理
				if (value === null || value === undefined) {
					value = ''
				}

				// 长数字转字符串（避免科学计数法）
				if (typeof value === 'number' && String(value).length > 12) {
					value = String(value)
				}

				row[key] = value
			}
			return row
		})

		// 3. 生成 Worksheet（json_to_sheet 会自动以对象 key 作为表头）
		const ws = XLSX.utils.json_to_sheet(processedData)

		// 4. 设置列宽（按表头长度自适应）
		const headers = Object.keys(processedData[0])
		ws['!cols'] = headers.map(header => ({
			wch: Math.max(header.length, 8) + 2 // 表头长度 + 余量
		}))

		// 5. 创建 Workbook
		const wb = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(wb, ws, sheetName)

		// 6. 导出文件
		const finalName = `${fileName}_${getDateTimeString()}.xlsx`
		XLSX.writeFile(wb, finalName)

		uni.showToast({
			title: '导出成功',
			icon: 'success'
		})
		return true

	} catch (error) {
		console.error('导出失败:', error)
		uni.showToast({
			title: '导出失败',
			icon: 'none'
		})
		return false
	}
}

/**
 * 获取格式化日期字符串（用于文件名）
 */
function getDateTimeString() {
	const d = new Date()
	const pad = n => String(n).padStart(2, '0')
	return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}`
}