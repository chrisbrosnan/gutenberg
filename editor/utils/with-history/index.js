/**
 * External dependencies
 */
import { includes } from 'lodash';

/**
 * Reducer enhancer which transforms the result of the original reducer into an
 * object tracking its own history (past, present, future).
 *
 * @param {Function} reducer            Original reducer.
 * @param {?Object}  options            Optional options.
 * @param {?Array}   options.resetTypes Action types upon which to clear past.
 *
 * @return {Function} Enhanced reducer.
 */
export default function withHistory( reducer, options = {} ) {
	const initialPresent = reducer( undefined, {} );

	const initialState = {
		// Past already contains record of present since changes are buffered in present.
		past: [ initialPresent ],
		present: initialPresent,
		future: [],
	};

	return ( state = initialState, action ) => {
		const { past, present, future } = state;

		switch ( action.type ) {
			case 'UNDO':
				// If there are changes in buffer, push buffer to the future.
				if ( past[ past.length - 1 ] !== present ) {
					return {
						past,
						present: past[ past.length - 1 ],
						future: [ present, ...future ],
					};
				}

				// Can't undo if no past.
				// If the present "buffer" is the same as the last record,
				// There is no further past.
				if ( past.length < 2 ) {
					return state;
				}

				return {
					past: past.slice( 0, past.length - 1 ),
					present: past[ past.length - 2 ],
					future: [ present, ...future ],
				};
			case 'REDO':
				// Can't redo if no future.
				if ( ! future.length ) {
					return state;
				}

				return {
					past: [ ...past, future[ 0 ] ],
					present: future[ 0 ],
					future: future.slice( 1 ),
				};

			case 'CREATE_UNDO_LEVEL':
				// Already has this level.
				if ( past[ past.length - 1 ] === present ) {
					return state;
				}

				return {
					past: [ ...past, present ],
					present,
					future: [],
				};
		}

		const nextPresent = reducer( present, action );

		if ( includes( options.resetTypes, action.type ) ) {
			return {
				past: [ nextPresent ],
				present: nextPresent,
				future: [],
			};
		}

		if ( present === nextPresent ) {
			return state;
		}

		return {
			past,
			present: nextPresent,
			future,
		};
	};
}
