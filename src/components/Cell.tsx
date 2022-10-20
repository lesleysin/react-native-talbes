import React, { FC, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { GestureResponderEvent, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

import broadcaster from "../utils/Broadcaster";
import DateTimeFormatter from "../utils/DateTimeFormatter";
import TableViewContext from "./TableViewContext";
import { TableStatic } from "../utils";

import type ColumnOptions from "../types/CellOptions";
import type { CellViewProps } from "../utils/TableStatic";
import { TableValues } from "../types/TableData";

interface ICellProps {
  config: ColumnOptions;
  parentIndex: number;
  ownIndex: number;
  cellProps?: CellViewProps & ViewStyle;
}

const Cell: FC<ICellProps> = ({ config, parentIndex, ownIndex, cellProps }) => {
	const [cellValue, setCellValue] = useState<TableValues>(null);
	const [pressed, setPressed] = useState(false);
	const {
		onCellPress,
		onRowPress,
		numericCellTextStyle,
		stringCellTextStyle,
		linkCellTextStyle,
		dateCellTextStyle,
		matrix,
	} = useContext(TableViewContext);

	const onRowPressInListener = useCallback((val: boolean) => {
		setPressed(val);
	}, []);

	const onRowPressOutListener = useCallback((val: boolean) => {
		setPressed(val);
	}, []);

	const onLongPressInHandler = useCallback((event: GestureResponderEvent) => {
		broadcaster.emit(`row:pressIn:${ownIndex}`, true);
		setPressed(true);

		onCellPress?.(event, matrix[parentIndex][ownIndex]);

		if (onRowPress) {
			const vals = [];

			//collect all cell values for curren row
			for (let index = 0; index < matrix.length; index++) {
				const element = matrix[index][ownIndex];
				vals.push(element);
			}
			onRowPress(event, vals);
		}
	}, []);

	const onRowPressOutHandler = useCallback(() => {
		broadcaster.emit(`row:pressOut:${ownIndex}`, false);
		setPressed(false);
	}, []);

	useEffect(() => {
		const val = matrix[parentIndex][ownIndex];

		if (val !== cellValue) {
			setCellValue(val);
		}
	}, [matrix]);

	useEffect(() => {
		broadcaster.addListener(`row:pressIn:${ownIndex}`, onRowPressInListener);
		broadcaster.addListener(`row:pressOut:${ownIndex}`, onRowPressOutListener);

		return () => {
			broadcaster.removeListener(`row:pressIn:${ownIndex}`, onRowPressInListener);
			broadcaster.removeListener(`row:pressOut:${ownIndex}`, onRowPressOutListener);
		};
	}, []);

	const cellBorderStyle = useMemo(() => {
		const dataLenght = matrix.length - 1;
		if (parentIndex === 0 || dataLenght === parentIndex) {
			return styles.flCellBorder;
		}

		return styles.defCellBorder;
	}, [parentIndex]);

	const preparedValue = useMemo(() => {
		if (cellValue === null || cellValue === undefined) return <View />;

		switch (config.type) {
		case "string": {
			return (
				<Text
					style={[styles.def, { ...stringCellTextStyle, ...TableStatic.stringCellTextStyle }]}
					numberOfLines={1}
				>
					{cellValue as string}
				</Text>
			);
		}
		case "number": {
			return (
				<Text
					style={[styles.def, { ...numericCellTextStyle, ...TableStatic.numericCellTextStyle }]}
					numberOfLines={1}
				>
					{cellValue as number}
				</Text>
			);
		}
		case "date": {
			const parsedDate = DateTimeFormatter.formatDate(
          cellValue as Date,
          config.format,
          config.locale
			);
			return (
				<Text
					style={[styles.def, { ...dateCellTextStyle, ...TableStatic.dateCellTextStyle }]}
					numberOfLines={1}
				>
					{parsedDate.toString()}
				</Text>
			);
		}
		case "link": {
			return (
				<Text
					numberOfLines={1}
					style={[styles.def, { ...linkCellTextStyle, ...TableStatic.linkCellTextStyle }]}
				>
					{cellValue as string}
				</Text>
			);
		}
		}
	}, [cellValue]);

	const pressedColor = useMemo(() => {
		if (TableStatic.cellContainerStyle.cellHighligntBackgroundColor) {
			return pressed ? TableStatic.cellContainerStyle.cellHighligntBackgroundColor : undefined;
		}

		if (cellProps?.cellHighligntBackgroundColor) {
			return pressed ? cellProps.cellHighligntBackgroundColor : undefined;
		}

		return pressed ? "#DCDCDC" : undefined;
	}, [cellProps, pressed]);

	return (
		<Pressable
			style={[styles.cell, cellBorderStyle, { backgroundColor: pressedColor }]}
			onLongPress={onLongPressInHandler}
			onPressOut={onRowPressOutHandler}
			delayLongPress={TableStatic.cellContainerStyle.longPressDelay ?? 100}
		>
			{preparedValue}
		</Pressable>
	);
};

const styles = StyleSheet.create({
	cell: {
		flex: 1,
		minHeight: 40,
		width: "auto",
		justifyContent: "center",
		alignItems: "center",
		padding: 8,
	},
	flCellBorder: {
		borderLeftWidth: 0.5,
		borderBottomWidth: 0.5,
		borderRightWidth: 0.5,
	},
	defCellBorder: {
		borderBottomWidth: 0.5,
		borderRightWidth: 0.5,
	},
	def: {
		fontSize: 14,
		fontWeight: "400",
		lineHeight: 16,
	},
});

export default Cell;
