import type { StatisticsRow, CostMode } from '../types';
import './StatisticsTable.css';

interface Props {
  rows: StatisticsRow[];
  costModes: CostMode[];
}

export const StatisticsTable = ({ rows, costModes }: Props) => {
  const showReal = costModes.includes('real');
  const showAcc = costModes.includes('accounting');
  const showBoth = showReal && showAcc;

  // Calculate totals
  const totals = rows.reduce(
    (acc, row) => ({
      revenue: acc.revenue + row.revenue,
      costReal: acc.costReal + row.costReal,
      costAcc: acc.costAcc + row.costAcc,
      profitReal: acc.profitReal + row.profitReal,
      profitAcc: acc.profitAcc + row.profitAcc,
      kgSold: acc.kgSold + row.kgSold,
    }),
    { revenue: 0, costReal: 0, costAcc: 0, profitReal: 0, profitAcc: 0, kgSold: 0 }
  );

  const avgMarginReal = totals.revenue > 0 ? (totals.profitReal / totals.revenue) * 100 : 0;
  const avgMarginAcc = totals.revenue > 0 ? (totals.profitAcc / totals.revenue) * 100 : 0;

  if (rows.length === 0) {
    return (
      <div className="statistics-table-empty">
        <p>Няма данни за избрания период и филтри</p>
      </div>
    );
  }

  return (
    <div className="statistics-table-container">
      <table className="statistics-table">
        <thead>
          <tr>
            <th>Период</th>
            <th className="statistics-table__number">Оборот (€)</th>
            
            {showReal && (
              <>
                <th className="statistics-table__number">
                  Себестойност {showBoth && '(реална)'} (€)
                </th>
                <th className="statistics-table__number">
                  Печалба {showBoth && '(реална)'} (€)
                </th>
              </>
            )}
            
            {showAcc && (
              <>
                <th className="statistics-table__number">
                  Себестойност {showBoth && '(счет.)'} (€)
                </th>
                <th className="statistics-table__number">
                  Печалба {showBoth && '(счет.)'} (€)
                </th>
              </>
            )}
            
            <th className="statistics-table__number">Продадени кг</th>
            
            {showReal && (
              <th className="statistics-table__number">
                Марж {showBoth && '(реален)'} (%)
              </th>
            )}
            
            {showAcc && (
              <th className="statistics-table__number">
                Марж {showBoth && '(счет.)'} (%)
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td className="statistics-table__period">{row.period}</td>
              <td className="statistics-table__number statistics-table__revenue">
                {row.revenue.toFixed(2)}
              </td>
              
              {showReal && (
                <>
                  <td className="statistics-table__number">
                    {row.costReal.toFixed(2)}
                  </td>
                  <td className={`statistics-table__number ${
                    row.profitReal >= 0 
                      ? 'statistics-table__profit--positive' 
                      : 'statistics-table__profit--negative'
                  }`}>
                    {row.profitReal.toFixed(2)}
                  </td>
                </>
              )}
              
              {showAcc && (
                <>
                  <td className="statistics-table__number">
                    {row.costAcc.toFixed(2)}
                  </td>
                  <td className={`statistics-table__number ${
                    row.profitAcc >= 0 
                      ? 'statistics-table__profit--positive' 
                      : 'statistics-table__profit--negative'
                  }`}>
                    {row.profitAcc.toFixed(2)}
                  </td>
                </>
              )}
              
              <td className="statistics-table__number statistics-table__kg">
                {row.kgSold.toFixed(1)}
              </td>
              
              {showReal && (
                <td className={`statistics-table__number ${
                  row.marginReal >= 0 
                    ? 'statistics-table__margin--positive' 
                    : 'statistics-table__margin--negative'
                }`}>
                  {row.marginReal.toFixed(1)}%
                </td>
              )}
              
              {showAcc && (
                <td className={`statistics-table__number ${
                  row.marginAcc >= 0 
                    ? 'statistics-table__margin--positive' 
                    : 'statistics-table__margin--negative'
                }`}>
                  {row.marginAcc.toFixed(1)}%
                </td>
              )}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="statistics-table__totals">
            <td className="statistics-table__period"><strong>ОБЩО</strong></td>
            <td className="statistics-table__number statistics-table__revenue">
              <strong>{totals.revenue.toFixed(2)}</strong>
            </td>
            
            {showReal && (
              <>
                <td className="statistics-table__number">
                  <strong>{totals.costReal.toFixed(2)}</strong>
                </td>
                <td className={`statistics-table__number ${
                  totals.profitReal >= 0 
                    ? 'statistics-table__profit--positive' 
                    : 'statistics-table__profit--negative'
                }`}>
                  <strong>{totals.profitReal.toFixed(2)}</strong>
                </td>
              </>
            )}
            
            {showAcc && (
              <>
                <td className="statistics-table__number">
                  <strong>{totals.costAcc.toFixed(2)}</strong>
                </td>
                <td className={`statistics-table__number ${
                  totals.profitAcc >= 0 
                    ? 'statistics-table__profit--positive' 
                    : 'statistics-table__profit--negative'
                }`}>
                  <strong>{totals.profitAcc.toFixed(2)}</strong>
                </td>
              </>
            )}
            
            <td className="statistics-table__number statistics-table__kg">
              <strong>{totals.kgSold.toFixed(1)}</strong>
            </td>
            
            {showReal && (
              <td className={`statistics-table__number ${
                avgMarginReal >= 0 
                  ? 'statistics-table__margin--positive' 
                  : 'statistics-table__margin--negative'
              }`}>
                <strong>{avgMarginReal.toFixed(1)}%</strong>
              </td>
            )}
            
            {showAcc && (
              <td className={`statistics-table__number ${
                avgMarginAcc >= 0 
                  ? 'statistics-table__margin--positive' 
                  : 'statistics-table__margin--negative'
              }`}>
                <strong>{avgMarginAcc.toFixed(1)}%</strong>
              </td>
            )}
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
